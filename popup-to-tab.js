// popup-to-tab.js
// Convert popup windows to new tabs on World Vision letter list page

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopupToTab);
} else {
  initPopupToTab();
}

function initPopupToTab() {
  // Add event listener with delegation
  document.body.addEventListener('click', handleLinkClick, true);
}

function handleLinkClick(event) {
  // Find the closest link element
  const link = event.target.closest('a');
  if (!link) return;
  
  const href = link.getAttribute('href');
  
  if (href && href.includes('goWindowOpen')) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    processLink(link, href);
  }
}

function processLink(linkElement, href) {
  console.log('VM Helper: Processing link click...');
  
  // Check times validation
  const timesInput = document.getElementById('times');
  if (timesInput && timesInput.value === "0") {
    alert("번역 유효시간이 지났습니다.");
    return;
  }
  
  // Extract parameters from goWindowOpen function call
  const regex = /goWindowOpen\('(\d+)',\s*'(\d+)'\)/;
  const matches = href.match(regex);
  
  if (!matches || matches.length !== 3) {
    console.log('VM Helper: Could not extract parameters from href:', href);
    return;
  }
  
  const seq = matches[1];
  const mseq = matches[2];
  const url = `${window.location.origin}/mypage/letterlist/letterview.do?letter_seq=${seq}&letter_mseq=${mseq}&isfinished=0&auto_helper=1`;
  
  console.log('VM Helper: Opening URL in new tab:', url);
  
  // Try Chrome extension API first, then fallback to window.open
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    try {
      chrome.runtime.sendMessage({
        action: "openInNewTab",
        url: url
      }, (response) => {
        if (chrome.runtime.lastError) {
          fallbackOpenTab(url);
        } else if (response && response.success) {
          // Successfully opened in new tab - helper will be auto-executed
          console.log('VM Helper: Successfully opened new tab with auto-helper');
        }
      });
    } catch (error) {
      fallbackOpenTab(url);
    }
  } else {
    fallbackOpenTab(url);
  }
}

function fallbackOpenTab(url) {
  try {
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      // Popup blocked - ask user if they want to navigate in current tab
      if (confirm('팝업이 차단되었습니다. 현재 탭에서 열까요?')) {
        window.location.href = url;
      }
    }
  } catch (error) {
    // Last resort - navigate in current tab
    window.location.href = url;
  }
}
