// Define web component
(function () {
  class FeedbackTestWidgetOne extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.innerHTML = `
      <div id="in-app-feedback-embed"></div>
      <style>
:root {
  --ds-typography-family-button: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  --ds-typography-size-button: 12px;
  --ds-typography-size-button-sm: 12px;
  --ds-typography-line-height-button-sm: 16px;
  --ds-shape-size-ymin-button-sm: 24px;
  --ds-space-inline-start-button-sm: 8px;
  --ds-space-inline-end-button-sm: 8px;
  --ds-typography-weight-button: 600;
  --ds-shape-radius-button: 2px;
  --ds-color-surface-page: #f5f6f6;
  --iaf-default-spacing: 4px;
  --ds-color-border-input: #c1c5cb;
  --ds-color-border-input-focus: #035970;
  --ds-color-outline-input: rgba(2, 145, 183, .3);
  --ds-color-surface-input-hover: #e0f2ff;
  --ds-color-border-input-hover: #035970;
  --ds-color-surface-button-primary-hover: #035970;
  --ds-color-border-button-primary-hover: #024051;
  --ds-color-typography-button-primary: #ffffff;
}

#QSIFeedbackButton-btn,
.QSI__EmbeddedFeedbackContainer_TextButton {
  font-family: var(--ds-typography-family-button) !important;
  font-size: var(--ds-typography-size-button) !important;
  font-weight: var(--ds-typography-weight-button) !important;
  border-radius: var(--ds-shape-radius-button) !important;
}

#QSIFeedbackButton-btn:hover > div,
.QSI__EmbeddedFeedbackContainer_TextButton:hover {
    background-color: var(--ds-color-surface-button-primary-hover) !important;
    border-color: var(--ds-color-border-button-primary-hover) !important;
    color: var(--ds-color-typography-button-primary) !important;
}

.QSI__EmbeddedFeedbackContainer {
    margin: 0 !important;
    font-size: 14px;
}

.QSI__EmbeddedFeedbackContainer fieldset {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--iaf-default-spacing);
}

.QSI__EmbeddedFeedbackContainer fieldset:has(.QSI__EmbeddedFeedbackContainer_Stars) {
    flex-direction: column;
}

.QSI__EmbeddedFeedbackContainer label {
    margin: 0 !important;
    flex: 100% 0 0;
}

.QSI__EmbeddedFeedbackContainer_Stars {
    margin-top: 4px;
}

.QSI__EmbeddedFeedbackContainer_OpenText {
    margin: 0 !important;
    flex: 0px 1 1;
    border-radius: 2px !important;
    border: 1px solid var(--ds-color-border-input) !important;
    box-sizing: content-box;
    padding: 0 var(--iaf-default-spacing) !important;
    width: auto !important;
    line-height: 16px;
    height: 22px;
}

.QSI__EmbeddedFeedbackContainer_OpenText:focus {
    border: 1px solid var(--ds-color-border-input-focus) !important;
    box-shadow: 0 0 0 2px var(--ds-color-outline-input) !important;
}

.QSI__EmbeddedFeedbackContainer_OpenText:hover {
    background-color: var(--ds-color-surface-input-hover);
    border: 1px solid var(--ds-color-border-input-hover);
}

.QSI__EmbeddedFeedbackContainer_TextButton {
    flex: auto 0 0;
    margin: 0 !important;
    border-radius: var(--ds-shape-radius-button) !important;
    border-style: solid;
    border-width: 1px;
    min-width: 0 !important;
    font-size: var(--ds-typography-size-button-sm) !important;
    line-height: var(--ds-typography-line-height-button-sm) !important;
    min-height: var(--ds-shape-size-ymin-button-sm);
    padding: 0 var(--ds-space-inline-end-button-sm) 0 var(--ds-space-inline-start-button-sm) !important;
}

feedback-test-widget-one {
    background-color: var(--ds-color-surface-page);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--iaf-default-spacing);
    border-radius: 4px !important;
}

#QSIFeedbackButton-target-container {
  border-right: 0 !important;
  border-bottom: 0 !important;
  border-radius: 4px 0 0 0 !important;
  border-color: #dcdee1 !important;
}
      </style>
    `;
      // Make sure Qualtrics is loaded, because for the first time the general Qualtrics code will actually be loaded later. In that case, reloading it is not necessary, since the initial load took care of the embedded feedback
      if (window.hasOwnProperty('QSI')) {
        QSI.API.unload();
        QSI.API.load();
        QSI.API.run();
      }
    }
  }

  customElements.define('feedback-test-widget-one', FeedbackTestWidgetOne);
})();

// Global object with functions that retrieve embedded data
InAppFeedback = {
  getSACPageName: () => {
    let pageTab = document.querySelector(
      '.sapEpmUiTabContainerPageTab.selected .sapEpmUiTabContainerTabTitle'
    )?.innerText;
    let pageSelect = document.querySelector('.sapEpmToolbarPageBrowserControl .sapMSelectListItemText')?.innerText;
    return pageTab ?? pageSelect ?? 'unknown page';
  },
  getSACStoryName: () => /(.+) - Storys - SAP Analytics Cloud/.exec(document.title)?.[1] ?? 'unknown story name',
  getSACStoryID: () => /\/([A-Z0-9]{32})\//.exec(document.location.href)?.[1] ?? 'unknown story id',
};

// General Qualtrics code
(function () {
  var g = function (e, h, f, g) {
    this.get = function (a) {
      for (var a = a + '=', c = document.cookie.split(';'), b = 0, e = c.length; b < e; b++) {
        for (var d = c[b]; ' ' == d.charAt(0); ) d = d.substring(1, d.length);
        if (0 == d.indexOf(a)) return d.substring(a.length, d.length);
      }
      return null;
    };

    this.set = function (a, c) {
      var b = '',
        b = new Date();
      b.setTime(b.getTime() + 6048e5);
      b = '; expires=' + b.toGMTString();
      document.cookie = a + '=' + c + b + '; path=/; ';
    };

    this.check = function () {
      var a = this.get(f);
      if (a) a = a.split(':');
      else if (100 != e)
        'v' == h && (e = Math.random() >= e / 100 ? 0 : 100), (a = [h, e, 0]), this.set(f, a.join(':'));
      else return !0;
      var c = a[1];
      if (100 == c) return !0;
      switch (a[0]) {
        case 'v':
          return !1;
        case 'r':
          return (c = a[2] % Math.floor(100 / c)), a[2]++, this.set(f, a.join(':')), !c;
      }
      return !0;
    };

    this.go = function () {
      if (this.check()) {
        var a = document.createElement('script');
        a.type = 'text/javascript';
        a.src = g;
        document.body && document.body.appendChild(a);
      }
    };

    this.start = function () {
      var t = this;
      'complete' !== document.readyState
        ? window.addEventListener
          ? window.addEventListener(
              'load',
              function () {
                t.go();
              },
              !1
            )
          : window.attachEvent &&
            window.attachEvent('onload', function () {
              t.go();
            })
        : t.go();
    };
  };

  try {
    new g(
      100,
      'r',
      'QSI_S_ZN_9U2HkXOMQCovLjU',
      'https://zn9u2hkxomqcovlju-bmwux.siteintercept.qualtrics.com/SIE/?Q_ZID=ZN_9U2HkXOMQCovLjU'
    ).start();
  } catch (i) {}
})();
