(function() {
  console.log("🚀 Xia Chat Premium Widget initialized!");

  const script = document.createElement('script');
  script.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
  document.head.appendChild(script);

  script.onload = () => {
    console.log("✅ Socket.io loaded in widget");
    
    const me = document.currentScript || document.querySelector('script[src*="widget.js"]');
    const workspaceId = me.getAttribute('data-workspace-id') || 'demo-workspace';
    
    // Auto-detect backend URL from the script src
    let backendUrl = 'https://xiachat.onrender.com';
    try {
      if (me && me.src) {
        backendUrl = new URL(me.src).origin;
      }
    } catch(e) {}

    // --- SMART AUTO BRANDING & DETECTION ---
    function detectThemeColor() {
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme && metaTheme.content && metaTheme.content.length > 3) return metaTheme.content;
      
      const btn = document.querySelector('button[class*="primary"], button[class*="main"], .btn-primary, .bg-primary');
      if (btn) {
        const bg = window.getComputedStyle(btn).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(255, 255, 255)') return bg;
      }

      const header = document.querySelector('header');
      if (header) {
        const bg = window.getComputedStyle(header).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(255, 255, 255)') return bg;
      }

      return '#111111'; // Apple-like premium default
    }

    function detectFont() {
      try {
        const bodyFont = window.getComputedStyle(document.body).fontFamily;
        if (bodyFont) return bodyFont;
      } catch(e) {}
      return '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    }

    function isDarkMode() {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
      try {
        const bg = window.getComputedStyle(document.body).backgroundColor;
        const rgb = bg.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
          return brightness < 128; // Below 128 is considered dark
        }
      } catch(e) {}
      return false;
    }

    // Settings
    let autoColor = detectThemeColor();
    let themeColor = me.getAttribute('data-theme-color') || autoColor; 
    let widgetFont = me.getAttribute('data-font') || detectFont();
    let dark = isDarkMode();
    let customVisitorBubble = null;
    let customAgentBubble = null;
    
    document.addEventListener("DOMContentLoaded", () => {
      autoColor = detectThemeColor();
      if (!me.getAttribute('data-theme-color') && !customVisitorBubble) {
        themeColor = autoColor;
        updateCSSVariables();
      }
    });
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      dark = e.matches;
      updateCSSVariables();
    });

    const style = document.createElement('style');
    document.head.appendChild(style);

    function updateCSSVariables() {
      const bgHex = dark ? 'rgba(30, 30, 32, 0.75)' : 'rgba(255, 255, 255, 0.85)';
      const textHex = dark ? '#F9FAFB' : '#111827';
      const borderHex = dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      const shadowHex = dark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)';
      const inputBg = dark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)';
      const botMsgBg = dark ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6';
      const botMsgText = dark ? '#F9FAFB' : '#111827';
      const visitorBubble = customVisitorBubble || themeColor;
      const agentBubble = customAgentBubble || botMsgBg;

      style.innerHTML = `
        :root {
          --xia-primary: ${themeColor};
          --xia-visitor-bubble: ${visitorBubble};
          --xia-agent-bubble: ${agentBubble};
          --xia-font: ${widgetFont};
          --xia-bg: ${bgHex};
          --xia-text: ${textHex};
          --xia-border: ${borderHex};
          --xia-shadow: 0 8px 32px ${shadowHex};
          --xia-input-bg: ${inputBg};
          --xia-bot-msg-bg: ${botMsgBg};
          --xia-bot-msg-text: ${botMsgText};
        }

        #xia-chat-button {
          position: fixed; bottom: 24px; right: 24px; width: 64px; height: 64px;
          background: var(--xia-primary); border-radius: 32px; 
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          cursor: pointer; z-index: 999999; display: flex; align-items: center;
          justify-content: center; color: white; font-family: var(--xia-font);
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
        }
        #xia-chat-button svg { width: 32px; height: 32px; fill: currentColor; }
        #xia-chat-button:hover { 
          transform: scale(1.08) translateY(-4px); 
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        
        #xia-badge {
          position: absolute; top: -2px; right: -2px; width: 22px; height: 22px;
          background: #EF4444; color: white; border-radius: 50%; font-size: 11px;
          font-weight: bold; display: flex; align-items: center; justify-content: center;
          border: 2px solid white; opacity: 0; transform: scale(0.5);
          transition: opacity 0.3s, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        #xia-badge.show { opacity: 1; transform: scale(1); }

        #xia-chat-window {
          position: fixed; bottom: 100px; right: 24px; width: 380px; height: 650px; max-height: calc(100vh - 120px);
          background: var(--xia-bg); border-radius: 24px; box-shadow: var(--xia-shadow);
          backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
          z-index: 999999; display: none; flex-direction: column; overflow: hidden;
          font-family: var(--xia-font); border: 1px solid var(--xia-border);
          transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15);
          transform-origin: bottom right;
          opacity: 0; transform: scale(0.9) translateY(20px);
        }
        #xia-chat-window.open { 
          display: flex; opacity: 1; transform: scale(1) translateY(0); 
        }

        .xia-header {
          background: transparent; color: var(--xia-text); padding: 20px 24px; font-weight: 700; 
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid var(--xia-border);
          box-shadow: 0 1px 0 rgba(255,255,255,0.05);
        }
        .xia-header-title { font-size: 18px; letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px; }
        .xia-header-status { width: 8px; height: 8px; background: #10B981; border-radius: 50%; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2); }
        .xia-close-btn {
          background: var(--xia-border); border: none; color: var(--xia-text); font-size: 16px; 
          cursor: pointer; width: 32px; height: 32px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .xia-close-btn:hover { background: rgba(128,128,128,0.2); }

        .xia-msg-area {
          flex: 1; padding: 20px 24px; overflow-y: auto; background: transparent; 
          display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth;
        }
        
        .xia-msg-area::-webkit-scrollbar { width: 6px; }
        .xia-msg-area::-webkit-scrollbar-thumb { background: var(--xia-border); border-radius: 3px; }

        .xia-bubble {
          padding: 12px 16px; font-size: 14.5px; line-height: 1.5; max-width: 85%;
          animation: xia-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          word-wrap: break-word; position: relative;
        }
        @keyframes xia-pop { 0% { opacity: 0; transform: scale(0.9) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }

        .xia-bubble-visitor {
          background: var(--xia-visitor-bubble); color: white; border-radius: 20px 20px 4px 20px; 
          align-self: flex-end; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .xia-bubble-agent {
          background: var(--xia-agent-bubble); color: var(--xia-bot-msg-text); border-radius: 20px 20px 20px 4px; 
          align-self: flex-start; border: 1px solid var(--xia-border);
        }

        .xia-time { font-size: 10px; opacity: 0.6; margin-top: 4px; display: block; }
        .xia-bubble-visitor .xia-time { text-align: right; color: rgba(255,255,255,0.8); }
        
        .xia-input-area {
          padding: 16px 20px; border-top: 1px solid var(--xia-border); background: transparent; 
          display: flex; gap: 12px; align-items: center;
          box-sizing: border-box; width: 100%;
        }
        .xia-input {
          flex: 1; padding: 12px 16px; border: 1px solid var(--xia-border); border-radius: 24px; 
          outline: none; color: var(--xia-text); background-color: var(--xia-input-bg);
          font-family: var(--xia-font); font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
          min-width: 0; box-sizing: border-box;
        }
        .xia-input:focus {
          border-color: var(--xia-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .xia-icon-btn {
          background: none; border: none; font-size: 20px; cursor: pointer; color: var(--xia-text);
          opacity: 0.6; transition: opacity 0.2s, transform 0.2s; padding: 4px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .xia-icon-btn svg { width: 22px; height: 22px; fill: currentColor; }
        .xia-icon-btn:hover { opacity: 1; transform: scale(1.1); }
        
        .xia-send-btn {
          background: var(--xia-primary); color: white; border: none; padding: 10px 16px; 
          border-radius: 20px; cursor: pointer; font-weight: 600; font-family: var(--xia-font);
          transition: transform 0.2s, opacity 0.2s; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex; align-items: center; gap: 6px;
          flex-shrink: 0; white-space: nowrap;
        }
        .xia-send-btn svg { width: 16px; height: 16px; fill: currentColor; }
        .xia-send-btn:hover { transform: scale(1.05); }
        .xia-send-btn:active { transform: scale(0.95); }

        .xia-prechat {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
          background: var(--xia-bg); z-index: 10; 
          display: flex; flex-direction: column; color: var(--xia-text);
          border-radius: 24px;
        }
        
        /* Typing Indicator */
        .xia-typing {
          display: flex; gap: 4px; padding: 14px 18px; align-self: flex-start;
          background: var(--xia-bot-msg-bg); border-radius: 20px 20px 20px 4px;
          border: 1px solid var(--xia-border); width: fit-content;
          animation: xia-pop 0.3s;
        }
        .xia-dot {
          width: 6px; height: 6px; background: var(--xia-text); border-radius: 50%; opacity: 0.4;
          animation: xia-bounce 1.4s infinite ease-in-out both;
        }
        .xia-dot:nth-child(1) { animation-delay: -0.32s; }
        .xia-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes xia-bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        @media (max-width: 480px) {
          #xia-chat-window {
            top: 0; left: 0; right: 0; bottom: 0 !important;
            width: 100% !important; height: 100dvh !important; max-height: 100dvh;
            border-radius: 0; border: none;
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
            transform: translateY(100%);
            box-sizing: border-box;
          }
          #xia-chat-window.open { transform: translateY(0); }
          #xia-chat-button { bottom: calc(20px + env(safe-area-inset-bottom)); right: 20px; }
          .xia-prechat { border-radius: 0; }
          .xia-input-area {
            padding: 12px 12px;
            gap: 8px;
          }
          .xia-send-btn {
            padding: 10px 12px;
          }
        }
      `;
    }
    updateCSSVariables();

    // ─── UI Setup ───
    const chatButton = document.createElement('div');
    chatButton.id = "xia-chat-button";
    chatButton.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      <div id="xia-badge">0</div>`;
    document.body.appendChild(chatButton);
    const badge = chatButton.querySelector('#xia-badge');

    const chatWindow = document.createElement('div');
    chatWindow.id = "xia-chat-window";

    const header = document.createElement('div');
    header.className = "xia-header";
    
    const titleContainer = document.createElement('div');
    titleContainer.className = "xia-header-title";
    
    const statusDot = document.createElement('div');
    statusDot.className = "xia-header-status";
    
    const titleSpan = document.createElement('span');
    titleSpan.innerText = "Support";
    
    titleContainer.appendChild(statusDot);
    titleContainer.appendChild(titleSpan);
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = "✕";
    closeBtn.className = "xia-close-btn";
    
    header.appendChild(titleContainer);
    header.appendChild(closeBtn);
    chatWindow.appendChild(header);

    const msgArea = document.createElement('div');
    msgArea.className = "xia-msg-area";
    chatWindow.appendChild(msgArea);

    const inputArea = document.createElement('div');
    inputArea.className = "xia-input-area";
    
    const input = document.createElement('input');
    input.type = "text";
    input.placeholder = "Type your message...";
    input.className = "xia-input";
    
    const fileInput = document.createElement('input');
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";

    const uploadBtn = document.createElement('button');
    uploadBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>`;
    uploadBtn.className = "xia-icon-btn";
    
    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('file', file);
      
      uploadBtn.style.opacity = '0.5';
      uploadBtn.disabled = true;

      try {
        const res = await fetch(`${backendUrl}/api/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success && socket) {
          appendMessage(data.url, 'visitor');
          socket.emit("send_message", {
            room: room, conversationId: conversationId, workspaceId: workspaceId,
            type: 'visitor', sender: visitorName || 'Visitor', text: data.url
          });
        }
      } catch (err) {
        console.error("Upload error", err);
      } finally {
        uploadBtn.style.opacity = '1';
        uploadBtn.disabled = false;
        fileInput.value = "";
      }
    };

    const sendBtn = document.createElement('button');
    sendBtn.innerHTML = `Send <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
    sendBtn.className = "xia-send-btn";
    
    const emojiBtn = document.createElement('button');
    emojiBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 1.5 8.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>`;
    emojiBtn.className = "xia-icon-btn";
    
    const emojiPopup = document.createElement('div');
    emojiPopup.className = "xia-emoji-popup";
    emojiPopup.style.cssText = "display:none; position:absolute; bottom:60px; left:16px; background:#fff; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); padding:8px; width:200px; display:flex; flex-wrap:wrap; gap:4px; z-index:100; border:1px solid rgba(0,0,0,0.05);";
    
    const emojis = ['😀','😂','😍','😊','🙏','👍','❤️','🔥','✨','👏','🎉','🚀','💡','🤔','😢','💯','🙌','👀','✅','👋'];
    emojis.forEach(em => {
      const btn = document.createElement('button');
      btn.innerHTML = em;
      btn.style.cssText = "border:none; background:none; font-size:20px; cursor:pointer; padding:4px; border-radius:4px; transition:background 0.2s;";
      btn.onmouseover = () => btn.style.background = 'rgba(0,0,0,0.05)';
      btn.onmouseout = () => btn.style.background = 'transparent';
      btn.onclick = () => {
        input.value += em;
        input.focus();
      };
      emojiPopup.appendChild(btn);
    });
    
    // Hide initially
    emojiPopup.style.display = 'none';

    emojiBtn.onclick = () => {
      emojiPopup.style.display = emojiPopup.style.display === 'none' ? 'flex' : 'none';
    };
    
    document.addEventListener('click', (e) => {
      if (!emojiBtn.contains(e.target) && !emojiPopup.contains(e.target)) {
        emojiPopup.style.display = 'none';
      }
    });

    inputArea.appendChild(emojiPopup);
    inputArea.appendChild(emojiBtn);
    inputArea.appendChild(uploadBtn);
    inputArea.appendChild(fileInput);
    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);
    chatWindow.appendChild(inputArea);
    
    document.body.appendChild(chatWindow);

    let isOpen = false;
    let unreadCount = 0;

    chatButton.onclick = () => {
      isOpen = !isOpen;
      if (isOpen) {
        chatWindow.classList.add('open');
        chatButton.style.transform = 'scale(0) translateY(20px)';
        chatButton.style.pointerEvents = 'none';
        unreadCount = 0;
        badge.classList.remove('show');
        badge.innerText = "0";
        
        const nameInput = chatWindow.querySelector('#xia-prechat-name');
        if (nameInput) nameInput.focus();
        else setTimeout(() => input.focus(), 300);
      }
    };

    closeBtn.onclick = () => {
      isOpen = false;
      chatWindow.classList.remove('open');
      chatButton.style.transform = 'scale(1) translateY(0)';
      chatButton.style.pointerEvents = 'auto';
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeBtn.onclick();
    });

    let conversationId = null;
    let room = null;
    let socket = null;
    
    let storedName = localStorage.getItem('xia_chat_visitor_name');
    let storedEmail = localStorage.getItem('xia_chat_visitor_email');
    if (storedName === "null" || storedName === "undefined") storedName = '';
    if (storedEmail === "null" || storedEmail === "undefined") storedEmail = '';
    
    let visitorName = window.XiaChatVisitorName || me.getAttribute('data-visitor-name') || storedName || '';
    let visitorEmail = window.XiaChatVisitorEmail || me.getAttribute('data-visitor-email') || storedEmail || '';

    const preChatForm = document.createElement('div');
    preChatForm.id = 'xia-prechat-form';
    preChatForm.className = "xia-prechat";
    preChatForm.innerHTML = `
      <div class="xia-header" style="justify-content: space-between; font-size: 18px;">
        <span></span>
        <span>Support</span>
        <button id="xia-prechat-close" class="xia-close-btn" style="margin-left:auto;">✕</button>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 32px 24px; overflow-y: auto;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 64px; height: 64px; background: rgba(59, 130, 246, 0.1); border-radius: 32px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">👋</div>
          <h3 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Welcome!</h3>
          <p style="margin: 0; font-size: 14px; opacity: 0.7; line-height: 1.5;">Please introduce yourself to start chatting with our team.</p>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 12px; font-weight: 700; opacity: 0.7; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Your Name *</label>
          <input id="xia-prechat-name" type="text" placeholder="e.g. John Doe" class="xia-input" style="width: 100%; box-sizing: border-box;" />
        </div>
        <div style="margin-bottom: 24px;">
          <label style="display: block; font-size: 12px; font-weight: 700; opacity: 0.7; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Email (optional)</label>
          <input id="xia-prechat-email" type="email" placeholder="e.g. john@example.com" class="xia-input" style="width: 100%; box-sizing: border-box;" />
        </div>
        <button id="xia-prechat-start" class="xia-send-btn" style="width: 100%; padding: 14px; font-size: 15px; justify-content: center;">
          Start Chat
        </button>
      </div>
    `;


    function showPreChatForm() {
      msgArea.style.display = 'none';
      inputArea.style.display = 'none';
      chatWindow.appendChild(preChatForm);

      const startBtn = preChatForm.querySelector('#xia-prechat-start');
      const nameInput = preChatForm.querySelector('#xia-prechat-name');
      const emailInput = preChatForm.querySelector('#xia-prechat-email');

      const submitForm = () => {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        if (!name) {
          nameInput.style.borderColor = '#EF4444';
          nameInput.focus();
          return;
        }
        visitorName = name;
        visitorEmail = email;
        localStorage.setItem('xia_chat_visitor_name', name);
        if (email) localStorage.setItem('xia_chat_visitor_email', email);
        
        preChatForm.style.opacity = '0';
        setTimeout(() => {
          preChatForm.remove();
          msgArea.style.display = 'flex';
          inputArea.style.display = 'flex';
          initChat();
        }, 300);
      };

      startBtn.onclick = submitForm;
      emailInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitForm(); });
      nameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') emailInput.focus(); });

      // Wire up close button inside pre-chat form
      const preChatCloseBtn = preChatForm.querySelector('#xia-prechat-close');
      if (preChatCloseBtn) {
        preChatCloseBtn.onclick = () => closeBtn.onclick();
      }
    }

    // Typing Indicator Logic
    let typingEl = null;
    function showTyping() {
      if (typingEl) return;
      typingEl = document.createElement('div');
      typingEl.className = 'xia-typing';
      typingEl.innerHTML = '<div class="xia-dot"></div><div class="xia-dot"></div><div class="xia-dot"></div>';
      msgArea.appendChild(typingEl);
      msgArea.scrollTop = msgArea.scrollHeight;
    }
    function hideTyping() {
      if (typingEl) {
        typingEl.remove();
        typingEl = null;
      }
    }

    function initChat() {
      showTyping(); // Simulate connecting/loading
      
      fetch(`${backendUrl}/api/widget/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workspaceId, 
          visitorInfo: { 
            name: visitorName || undefined, 
            email: visitorEmail || undefined, 
            browser: navigator.userAgent, 
            origin: window.location.hostname, 
            currentPage: window.location.href 
          } 
        })
      })
      .then(res => res.json())
      .then(data => {
        hideTyping();
        if (data.success) {
          conversationId = data.conversationId;
          room = data.room;
          
          if (data.config) {
            if (data.config.autoTheme === false) {
               if (!me.getAttribute('data-theme-color') && data.config.themeColor) {
                 themeColor = data.config.themeColor;
               }
               if (data.config.visitorBubbleColor) customVisitorBubble = data.config.visitorBubbleColor;
               if (data.config.agentBubbleColor) customAgentBubble = data.config.agentBubbleColor;
            }
            updateCSSVariables();

            if (data.config.widgetTitle) {
               titleSpan.innerText = data.config.widgetTitle;
               const preTitle = preChatForm.querySelector('.xia-header');
               if(preTitle) preTitle.innerText = data.config.widgetTitle;
            }
          }

          if (data.messages && data.messages.length > 0) {
            data.messages.forEach(m => {
              appendMessage(m.text, m.senderType === 'visitor' ? 'visitor' : 'agent', m.createdAt);
            });
          } else {
            if (data.config && data.config.welcomeMsg) {
              appendMessage(data.config.welcomeMsg, 'agent', new Date());
            }
          }

          socket = io(backendUrl, {
            forceNew: true,
            query: { type: 'visitor' }
          });
          
          socket.on("connect", () => {
            console.log("✅ Widget socket connected!");
            socket.emit("join_chat", { room: room });
          });
          if (socket.connected) {
            console.log("✅ Widget socket already connected!");
            socket.emit("join_chat", { room: room });
          }

          socket.on("receive_message", (msgData) => {
            if (msgData.conversationId === conversationId && msgData.senderType !== 'visitor') {
              hideTyping();
              appendMessage(msgData.text, 'agent', new Date());
              
              if (!isOpen) {
                unreadCount++;
                badge.innerText = unreadCount > 9 ? '9+' : unreadCount;
                badge.classList.add('show');
                // Pop animation on button
                chatButton.style.transform = 'scale(1.2)';
                setTimeout(() => chatButton.style.transform = 'scale(1)', 200);
              }
            }
          });
        }
      })
      .catch(err => {
        hideTyping();
        console.error("Widget Init Error:", err);
      });
    }

    if (visitorName) {
      initChat();
    } else {
      showPreChatForm();
    }

    function appendMessage(text, type, dateStr) {
      const bubbleContainer = document.createElement('div');
      bubbleContainer.className = "xia-bubble " + (type === 'visitor' ? 'xia-bubble-visitor' : 'xia-bubble-agent');
      
      let msgHTML = text;
      if (text && text.includes("res.cloudinary.com")) {
        try {
          const url = new URL(text);
          if (url.hostname === "res.cloudinary.com" && url.protocol === "https:") {
            msgHTML = `<a href="${url.href}" target="_blank"><img src="${url.href}" style="max-width: 100%; border-radius: 8px; margin-bottom: 4px;" /></a>`;
          }
        } catch(e) {}
      }
      
      bubbleContainer.innerHTML = msgHTML;
      
      // Add timestamp
      const timeSpan = document.createElement('span');
      timeSpan.className = "xia-time";
      const d = dateStr ? new Date(dateStr) : new Date();
      timeSpan.innerText = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      bubbleContainer.appendChild(timeSpan);
      
      // Remove typing indicator before appending new message to keep it at bottom
      hideTyping();
      msgArea.appendChild(bubbleContainer);
      msgArea.scrollTop = msgArea.scrollHeight;
    }

    function handleSend() {
      const text = input.value.trim();
      if (!text) return;
      appendMessage(text, 'visitor', new Date());
      input.value = "";
      
      showTyping(); // Simulate AI/Agent thinking immediately
      
      const payload = {
        room: room, conversationId: conversationId, workspaceId: workspaceId,
        type: 'visitor', sender: visitorName || 'Visitor', text: text
      };

      if (!socket || !socket.connected) {
        let retryCount = 0;
        const interval = setInterval(() => {
          if (socket && socket.connected) {
            socket.emit("send_message", payload);
            clearInterval(interval);
          }
          retryCount++;
          if (retryCount > 60) {
            clearInterval(interval);
            hideTyping();
          } // give up after 60s
        }, 1000);
        return;
      }
      
      socket.emit("send_message", payload);
    }

    sendBtn.onclick = handleSend;
    input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
  };
})();
