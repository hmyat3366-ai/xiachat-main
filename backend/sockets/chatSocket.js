const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Workspace = require('../models/Workspace');

const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Socket Authentication Middleware
  io.use((socket, next) => {
    // Allow visitors to connect without token if they specify type=visitor
    if (socket.handshake.query.type === 'visitor') {
      return next();
    }
    
    // Require JWT token for agents/dashboard
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }
    
    try {
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'dev_fallback_secret_change_in_production');
      socket.user = decoded.user;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Client connected: ${socket.id} (User: ${socket.user ? socket.user.id : 'Visitor'})`);

    // When a user joins a chat room
    socket.on('join_chat', (data) => {
      socket.join(data.room);
      console.log(`User joined room: ${data.room}`);
    });

    socket.on('join_workspace', (data) => {
      const workspaceId = typeof data === 'string' ? data : data.workspaceId;
      const departmentIds = typeof data === 'object' && data.departmentIds ? data.departmentIds : [];
      socket.join(`workspace_${workspaceId}`);
      departmentIds.forEach(deptId => {
        socket.join(`workspace_${workspaceId}_dept_${deptId}`);
      });
      console.log(`Agent joined workspace: workspace_${workspaceId}`);
    });

    // When a message is sent
    socket.on('send_message', async (data) => {
      try {
        if (data.conversationId) {
          const newMessage = new Message({
            conversationId: data.conversationId,
            senderType: data.type || 'visitor',
            senderName: data.sender || 'Anonymous',
            text: data.text
          });
          await newMessage.save();

          const conv = await Conversation.findById(data.conversationId).populate('visitorId');
          
          let updateData = { lastMessageAt: new Date(), lastMessage: data.text };
          if (data.type === 'visitor' || !data.type) {
            updateData.$inc = { unreadCount: 1 };
          }
          
          await Conversation.findByIdAndUpdate(data.conversationId, updateData);

          // OMUNICHANNEL: Forward operator message to respective external platforms
          if (data.type === 'operator' && conv) {
             if (conv.channel === 'facebook' && conv.visitorId?.metadata?.psid) {
                try {
                   const fbToken = process.env.FB_PAGE_ACCESS_TOKEN || 'test-token';
                   fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${fbToken}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        recipient: { id: conv.visitorId.metadata.psid },
                        message: { text: data.text }
                      })
                   }).catch(e => console.error("FB API Error:", e));
                } catch(e) {}
             } else if (conv.channel === 'whatsapp' && conv.visitorId?.metadata?.wa_id) {
                try {
                   const waToken = process.env.WA_ACCESS_TOKEN || 'test-token';
                   const waPhoneId = process.env.WA_PHONE_NUMBER_ID || 'test-phone-id';
                   fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
                      method: 'POST',
                      headers: { 
                         'Authorization': `Bearer ${waToken}`,
                         'Content-Type': 'application/json' 
                      },
                      body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: conv.visitorId.metadata.wa_id,
                        type: "text",
                        text: { body: data.text }
                      })
                   }).catch(e => console.error("WA API Error:", e));
                } catch(e) {}
             }
          }

          // 🤖 AUTO-REPLY LOGIC & AI AGENT
          if (data.type === 'visitor' || data.type === 'Visitor') {
            let workspace = null;
            if (data.workspaceId && data.workspaceId.length === 24) {
              workspace = await Workspace.findById(data.workspaceId);
            }
            
            // AI HANDOFF LOGIC (Visitor requesting human)
            const lowerText = data.text.toLowerCase();
            const requestsHuman = lowerText.includes('human') || lowerText.includes('agent') || lowerText.includes('talk to someone');
            
            if (requestsHuman && conv && conv.mode === 'ai') {
              await Conversation.findByIdAndUpdate(conv._id, { mode: 'human', aiEnabled: false });
              io.emit('receive_message', {
                id: Date.now(),
                conversationId: data.conversationId,
                room: data.room,
                type: 'system',
                sender: 'System',
                text: "Transferring you to a human agent...",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });
              
              const targetRoom = conv.departmentId ? `workspace_${workspace._id}_dept_${conv.departmentId}` : `workspace_${workspace._id}`;
              io.to(targetRoom).emit('agent_notification', {
                type: 'handoff',
                conversationId: conv._id,
                message: 'A visitor requested human assistance.'
              });
              return;
            }

            // Check if conversation mode is 'ai' and AI is enabled on workspace
            if (workspace && (workspace.plan === 'pro' || workspace.aiEnabled) && conv && conv.mode === 'ai') {
               
               // 1. CONCURRENCY PROTECTION
               if (conv.aiProcessing) {
                 console.log(`Skipping AI generation for ${conv._id}: already processing.`);
                 return; // Prevent duplicate execution
               }
               
               // 2. TOKEN USAGE CHECK
               if (workspace.aiTokensUsed >= workspace.aiMonthlyLimit) {
                 console.log(`Workspace ${workspace._id} reached AI token limit.`);
                 await Conversation.findByIdAndUpdate(conv._id, { mode: 'human', aiEnabled: false });
                 io.emit('receive_message', {
                   id: Date.now(),
                   conversationId: data.conversationId,
                   room: data.room,
                   type: 'system',
                   sender: 'System',
                   text: "AI limit reached. Transferring to human agent.",
                   time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                 });
                 return;
               }

               await Conversation.findByIdAndUpdate(conv._id, { aiProcessing: true });

               try {
                 const pastMessages = await Message.find({ conversationId: data.conversationId }).sort({ createdAt: 1 }).limit(10);
                 const chatHistory = pastMessages.map(m => ({
                     role: (m.senderType === 'operator' || m.senderType === 'ai') ? 'assistant' : 'user',
                     content: m.text
                 }));

                 const aiModelMap = {
                   'llama-3-8b-free': 'meta-llama/llama-3-8b-instruct:free',
                   'gemma-2-9b-free': 'google/gemma-2-9b-it:free',
                   'qwen-2.5-7b-free': 'qwen/qwen-2.5-7b-instruct:free',
                   'laguna-m-1-free': 'poolside/laguna-m.1:free'
                 };
                 let modelToUse = aiModelMap[workspace.aiModel];
                 if (!modelToUse) modelToUse = 'meta-llama/llama-3-8b-instruct:free';
                 const apiKey = workspace.aiApiKey || process.env.OPENROUTER_API_KEY;
                 
                 if (!apiKey) {
                   throw new Error("Missing OPENROUTER_API_KEY. AI requires a valid API key.");
                 }

                 // 3. PROPER RAG PIPELINE (Keyword-based retrieval mock)
                 let kbContext = "";
                 try {
                   const kb = require('../models/KnowledgeBase');
                   const items = await kb.find({ workspaceId: workspace._id, status: 'active' });
                   if (items.length > 0) {
                     // Extract keywords from the last user message
                     const userKeywords = data.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                     
                     // Score and chunk KB items
                     const scoredChunks = [];
                     items.forEach(item => {
                        const chunks = item.content.split('\n\n');
                        chunks.forEach(chunk => {
                           let score = 0;
                           const lowerChunk = chunk.toLowerCase();
                           userKeywords.forEach(kw => {
                             if (lowerChunk.includes(kw)) score++;
                           });
                           if (score > 0 || userKeywords.length === 0) {
                             scoredChunks.push({ chunk, title: item.title, score });
                           }
                        });
                     });
                     
                     // Sort by score and pick top chunks to prevent overflow
                     scoredChunks.sort((a, b) => b.score - a.score);
                     const topChunks = scoredChunks.slice(0, 3);

                     if (topChunks.length > 0) {
                       kbContext = "\n\nKnowledge Base Context:\n" + topChunks.map(c => `[${c.title}]: ${c.chunk}`).join("\n---\n");
                     }
                   }
                 } catch(e) {
                   console.error("Error loading KB", e);
                 }

                 const defaultSystemPrompt = "You are a helpful customer support AI for Xia Chat. Always answer questions based ONLY on the provided Knowledge Base Context. If the answer is not in the Knowledge Base, politely say you don't know and offer to connect them with a human agent. Do not hallucinate or make up information.";
                 const systemPrompt = (workspace.aiSystemPrompt || defaultSystemPrompt) + kbContext;
                 
                 const requestBody = {
                   model: modelToUse,
                   messages: [
                     { role: "system", content: systemPrompt },
                     ...chatHistory
                   ]
                 };

                 // 4. AI ERROR HANDLING & RETRY LOGIC
                 let aiData = null;
                 let retries = 2;
                 while (retries > 0 && !aiData) {
                   try {
                     const controller = new AbortController();
                     const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
                     
                     const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                       method: "POST",
                       headers: {
                         "Authorization": `Bearer ${apiKey}`,
                         "Content-Type": "application/json",
                         "HTTP-Referer": "https://xiachat.com",
                         "X-Title": "Xia Chat SaaS"
                       },
                       body: JSON.stringify(requestBody),
                       signal: controller.signal
                     });
                     
                     clearTimeout(timeoutId);

                     if (response.ok) {
                       aiData = await response.json();
                     } else {
                       throw new Error(`OpenRouter API responded with status ${response.status}`);
                     }
                   } catch (err) {
                     console.error(`AI Fetch attempt failed (${retries} retries left):`, err.message);
                     retries--;
                     if (retries > 0) await new Promise(r => setTimeout(r, 1000));
                   }
                 }
                 
                 let aiReplyText = "AI is temporarily unavailable. Would you like to chat with an agent?";
                 let usageData = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
                 
                 if (aiData && aiData.choices && aiData.choices[0] && aiData.choices[0].message) {
                   aiReplyText = aiData.choices[0].message.content;
                   if (aiData.usage) {
                      usageData = aiData.usage;
                   } else {
                      usageData.total_tokens = Math.ceil((JSON.stringify(requestBody).length + aiReplyText.length) / 4);
                   }
                 }
                 
                 let triggerHandoff = false;
                 if (aiReplyText.includes('[HANDOFF]')) {
                    triggerHandoff = true;
                    aiReplyText = aiReplyText.replace(/\[HANDOFF\]/g, '').trim();
                    if (!aiReplyText) aiReplyText = "I'm transferring you to a human agent now.";
                 }

                 // TOKEN USAGE TRACKING
                 await Workspace.findByIdAndUpdate(workspace._id, {
                    $inc: { 
                      aiTokensUsed: usageData.total_tokens || 100,
                      aiRequestsUsed: 1
                    }
                 });

                 const aiReply = new Message({
                   conversationId: data.conversationId,
                   senderType: 'ai',
                   senderName: 'AI Assistant',
                   text: aiReplyText
                 });
                 await aiReply.save();
                 
                 if (triggerHandoff) {
                    await Conversation.findByIdAndUpdate(conv._id, { mode: 'human', aiEnabled: false });
                    const targetRoom = conv.departmentId ? `workspace_${workspace._id}_dept_${conv.departmentId}` : `workspace_${workspace._id}`;
                    io.to(targetRoom).emit('agent_notification', {
                      type: 'handoff',
                      conversationId: conv._id,
                      message: 'AI initiated handoff to a human agent.'
                    });
                 }
                 
                 const emitTarget = data.workspaceId ? `workspace_${data.workspaceId}` : (workspace ? `workspace_${workspace._id.toString()}` : null);
                 if (emitTarget) {
                    io.to(data.room).to(emitTarget).emit('receive_message', {
                      id: aiReply._id,
                      conversationId: data.conversationId,
                      room: data.room,
                      type: 'ai',
                      sender: 'AI Assistant',
                      text: aiReply.text,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                 } else {
                    io.emit('receive_message', {
                      id: aiReply._id,
                      conversationId: data.conversationId,
                      room: data.room,
                      type: 'ai',
                      sender: 'AI Assistant',
                      text: aiReply.text,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                 }
                 
                 await Conversation.findByIdAndUpdate(data.conversationId, { lastMessageAt: new Date() });

               } catch (error) {
                 console.error(`AI Generation Error [Workspace ${workspace._id}]:`, error.message);
                 const aiReply = new Message({
                   conversationId: data.conversationId,
                   senderType: 'ai',
                   senderName: 'System',
                   text: "AI is temporarily unavailable. Please wait for an agent."
                 });
                 await aiReply.save();

                 const emitTarget = data.workspaceId ? `workspace_${data.workspaceId}` : (workspace ? `workspace_${workspace._id.toString()}` : null);
                 if (emitTarget) {
                   io.to(data.room).to(emitTarget).emit('receive_message', {
                     id: aiReply._id,
                     conversationId: data.conversationId,
                     room: data.room,
                     type: 'ai',
                     sender: 'System',
                     text: aiReply.text,
                     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                   });
                 } else {
                   io.emit('receive_message', {
                     id: aiReply._id,
                     conversationId: data.conversationId,
                     room: data.room,
                     type: 'ai',
                     sender: 'System',
                     text: aiReply.text,
                     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                   });
                 }
               } finally {
                 // RELEASE LOCK
                 await Conversation.findByIdAndUpdate(conv._id, { aiProcessing: false });
               }

            } else if (!conv || conv.mode !== 'human') {
               // Fallback Auto Reply if not explicitly human mode
               const visitorMessageCount = await Message.countDocuments({
                 conversationId: data.conversationId,
                 senderType: { $in: ['visitor', 'Visitor'] }
               });

               if (visitorMessageCount === 1) {
                 setTimeout(async () => {
                   const autoReply = new Message({
                     conversationId: data.conversationId,
                     senderType: 'operator',
                     senderName: 'Automated Assistant',
                     text: "Mingalapar, what you need sir? Our team will be with you shortly."
                   });
                   await autoReply.save();
                   
                   const emitTarget = data.workspaceId ? `workspace_${data.workspaceId}` : null;
                   if (emitTarget) {
                     io.to(data.room).to(emitTarget).emit('receive_message', {
                       id: autoReply._id,
                       conversationId: data.conversationId,
                       room: data.room,
                       type: 'operator',
                       sender: 'Automated Assistant',
                       text: autoReply.text,
                       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                     });
                   } else {
                     io.emit('receive_message', {
                       id: autoReply._id,
                       conversationId: data.conversationId,
                       room: data.room,
                       type: 'operator',
                       sender: 'Automated Assistant',
                       text: autoReply.text,
                       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                     });
                   }
                   
                   await Conversation.findByIdAndUpdate(data.conversationId, { lastMessageAt: new Date() });
                 }, 1500); 
               }
            }
          }
          // Broadcast the formatted message object
          const emitTarget = data.workspaceId ? `workspace_${data.workspaceId}` : null;
          const payload = {
            id: newMessage._id || Date.now(),
            conversationId: data.conversationId,
            room: data.room,
            type: newMessage.senderType,
            senderType: newMessage.senderType,
            sender: newMessage.senderName,
            text: newMessage.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          if (data.room) {
             io.to(data.room).emit('receive_message', payload);
          }
          if (emitTarget) {
             io.to(emitTarget).emit('receive_message', payload);
          }
          if (!emitTarget && !data.room) {
             io.emit('receive_message', payload);
          }
          
          console.log('Message saved & sent:', data.text);
        }
      } catch (err) {
        console.error("Error saving message:", err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔴 Client disconnected: ${socket.id}`);
    });
  });
};
