"use strict";

function chunchunmaru(containerId, settings)
{
	if (containerId === undefined) {
		throw 'First parameter, container id, cannot be null.';
	}

	settings = settings || {};

	var defaultSettings = {
		attributes: {
			id: "chunchunmaru-textarea",
			name: "chunchunmaru-textarea",
			placeholder: "Start writting!",
		},
		atLink: false,
		atLinkBase: 'https://github.com/',
		autoSave: false,
		gfm: true,
		livePreview: false,
		livePreviewContainer: "",
		previewCodeHighlight: false,
		sanitize: true,
		saveHTML: false,
		toolbars: [
			'bold',
			'italic',
			'|',
			'link',
			'blockquote',
			'code',
			'image',
			'|',
			'center',
			'ol',
			'ul',
			'|',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'|',
			'undo',
			'redo',
		]
	};

	var settings = this.settings = Object.assign(defaultSettings, settings);

	this.regexs = {
        atLink: /@(\w+)/g,
        email: /(\w+)@(\w+)\.(\w+)\.?(\w+)?/g,
        emailLink: /(mailto:)?([\w\.\_]+)@(\w+)\.(\w+)\.?(\w+)?/g,
        emoji: /:([\w\+-]+):/g,
        emojiDatetime: /(\d{2}:\d{2}:\d{2})/g,
        twemoji: /:(tw-([\w]+)-?(\w+)?):/g,
        pageBreak: /^\[[=]{8,}\]$/
    };

	this.loadScript = function(filepath, callback, into) {
        into = into || "body";
        callback = callback || function() {};

        var script = document.createElement("script");
        script.type = "text/javascript";        
		script.src = filepath;

		var isIE = (navigator.appName == "Microsoft Internet Explorer");
    	var isIE8 = (isIE && navigator.appVersion.match(/8./i) == "8.");

        if (isIE8) {            
            script.onreadystatechange = function() {
                if(script.readyState) {
                    if (script.readyState === "loaded" || script.readyState === "complete") {
                        script.onreadystatechange = null; 
                        callback();
                    }
                } 
            };
        }
        else {
            script.onload = function() {
                callback();
            };
        }
 
        if (into === "body") {
            document.getElementsByTagName("body")[0].appendChild(script);
		} 
		else {
            document.body.appendChild(script);
        }
	};

	this.loadCSS = function(filepath, callback, into) {
        into = into || "head";        
        callback = callback || function() {};
        
        var css = document.createElement("link");
        css.type = "text/css";
        css.rel = "stylesheet";
        css.onload = css.onreadystatechange = function() {
            callback();
        };

        css.href = filepath;

        if(into === "head") {
            document.getElementsByTagName("head")[0].appendChild(css);
		} 
		else {
            document.body.appendChild(css);
        }
    };

	this.loadScript("https://code.iconify.design/1/1.0.7/iconify.min.js");

	/**
	 * Dependents check
	 */
	if (settings.livePreview) {
		this.previewContainer = document.querySelector(this.settings.livePreviewContainer);

		if (typeof marked === "undefined") {
			throw 'marked is not defined';
		}

		if (settings.previewCodeHighlight) {
			if (typeof hljs === "undefined") {
				throw 'highlight.js is not defined';
			}
		}

		var markedRenderer = new marked.Renderer();
		var atLinkReg = this.regexs.atLink;
		var emailReg = this.regexs.email;

		// atLink Renderer
		markedRenderer.paragraph = (text) => {
            if (settings.atLink) {

                if (atLinkReg.test(text))  {
                    text = text.replace(emailReg, function($1, $2, $3, $4) {
                        return $1.replace(/@/g, "_#_&#64;_#_");
                    });

                    text = text.replace(atLinkReg, function($1, $2) {
                        return "<a href=\"" + settings.atLinkBase + "" + $2 + "\" title=\"&#64;" + $2 + "\" class=\"at-link\">" + $1 + "</a>";
                    }).replace(/_#_&#64;_#_/g, "@");
				}

                return text;
            }

            return text;
		};

		var markedOptions = this.markedOptions = {
			renderer: markedRenderer,
			gfm: settings.gfm,
			tables: true,
			breaks: true,
			pedantic: false,
			smartLists: true,
			smartypants: false,
			highlight: settings.previewCodeHighlight ? function(code, lang) {
				const language = hljs.getLanguage(lang) ? lang : 'plaintext';
				return hljs.highlight(code, { language }).value;
			} : false,
			langPrefix: settings.previewCodeHighlight ? 'hljs lang-' : "lang-",
		};

		marked.setOptions(markedOptions);
	}

	if (settings.sanitize) {
		if (typeof DOMPurify === "undefined") {
			throw 'DOMPurify is not defined';
		}
		// add hook to check iframe src, accept only Youtube embed.
		DOMPurify.addHook('uponSanitizeElement', (node, data) => {
			if (data.tagName === 'iframe') {
				const src = node.getAttribute('src') || ''
				if (!src.startsWith('https://www.youtube.com/embed/')) {
					return node.parentNode.removeChild(node);
				}
			}
		});
	}

	/**
	 * Load Elements
	 */
	this.container = document.getElementById(containerId);

	this.toolbar = document.createElement("div");

	this.textarea = this.container.getElementsByTagName('textarea')[0] || document.createElement("textarea");

	for (var attr in settings.attributes) {
		var value = settings.attributes[attr];
		if (!this.textarea.getAttribute(attr)) {
			this.textarea.setAttribute(attr, value);
		}
	}

	this.container.className += "chunchumaru-container";
	this.toolbar.className += "chunchunmaru-editor-toolbar";
	this.textarea.className += "chunchunmaru-editor";

	this.container.appendChild(this.toolbar);
	this.container.appendChild(this.textarea);

	/**
	 * Methods
	 */
	this.addBracketToSelection = (pre, post) => {
		var textarea = this.textarea;
		var content = textarea.value;
		var start = textarea.selectionStart;
		var end = textarea.selectionEnd;

		var selectedText = window.getSelection().toString();

		var processedText = pre + selectedText + post;
		
		var preText = content.substring(0, start);
		var postText = content.substring(end, textarea.value.length);

		// new content
		this.textarea.value = preText + processedText + postText;
		this.textarea.focus();
		this.textarea.selectionStart = start + pre.length + selectedText.length;
		this.textarea.selectionEnd = start + pre.length + selectedText.length;
	}

	this.insertString = (string) => {
		var content = this.textarea.value;
		var cursorPosition = this.textarea.selectionStart;

		var preText = content.substring(0, cursorPosition);
		var postText = content.substring(cursorPosition, content.length);

		this.textarea.value = preText + string + postText;
		this.textarea.selectionStart = cursorPosition + string.length;
		this.textarea.selectionEnd = cursorPosition + string.length;
	}

	this.addPrefixToSelectedLine = (prefix) => {
		var textarea = this.textarea;
		var selectionStart = textarea.selectionStart;
		var selectionEnd = textarea.selectionEnd;

		if (selectionStart == selectionEnd) {
			var lines = textarea.value.substr(0, selectionStart).split("\n");
			lines[lines.length - 1] = prefix + lines[lines.length - 1];
		}
		else {
			var lineStartIndex = textarea.value.substr(0, selectionStart).split("\n").length - 1;
			var lineEndIndex = textarea.value.substr(0, selectionEnd).split("\n").length - 1;

			var lines = textarea.value.split("\n");
			if (lineStartIndex > lineEndIndex) {
				var temp = lineEndIndex;
				lineEndIndex = lineStartIndex;
				lineStartIndex = temp;
			}

			while (lineStartIndex <= lineEndIndex) {
				lines[lineStartIndex] = prefix + lines[lineStartIndex];
				lineStartIndex += 1;
			}
		}
		this.textarea.value = lines.join("\n");
		this.textarea.focus();
	}

	this.addOrderToSelectedLine = (prefix) => {
		var textarea = this.textarea;
		var selectionStart = textarea.selectionStart;
		var selectionEnd = textarea.selectionEnd;

		var order = 1;
		if (selectionStart == selectionEnd) {
			var lines = textarea.value.substr(0, selectionStart).split("\n");
			lines[lines.length - 1] = order + lines[lines.length - 1];
		}
		else {
			var lineStartIndex = textarea.value.substr(0, selectionStart).split("\n").length - 1;
			var lineEndIndex = textarea.value.substr(0, selectionEnd).split("\n").length - 1;

			var lines = textarea.value.split("\n");
			if (lineStartIndex > lineEndIndex) {
				var temp = lineEndIndex;
				lineEndIndex = lineStartIndex;
				lineStartIndex = temp;
			}

			while (lineStartIndex <= lineEndIndex) {
				lines[lineStartIndex] = `${order}. ` + lines[lineStartIndex];
				lineStartIndex += 1;
				order += 1;
			}
		}
		this.textarea.value = lines.join("\n");
		this.textarea.focus();
	}

	this.saveMarkdownToInnerHTML = () => {
		this.textarea.innerHTML = this.textarea.value;
	}

	this.getHTML = () => {
		var dirtyHTML = marked(this.textarea.value);
		if (settings.sanitize) {
			var cleanHTML = DOMPurify.sanitize(dirtyHTML);
			return cleanHTML;
		}
		else {
			return dirtyHTML;
		}
	}

	this.markdownToHTML = (markdown) => {
		var dirtyHTML = marked(markdown);
		if (settings.sanitize) {
			var cleanHTML = DOMPurify.sanitize(dirtyHTML);
			return cleanHTML;
		}
		return dirtyHTML;
	}

	/**
	 * Keyboard & Undo Redo events
	 */
	var undoState = [''];
	var redoState = [];
	var maxSaveThreshold = 20;

	this.hotkeys = {
		'b': (event) => {
			if (event.ctrlKey) {
				this.addBracketToSelection("**", "**");
			}
		},

		'i': (event) => {
			if (event.ctrlKey) {
				this.addBracketToSelection("*", "*");
			}
		},

		'Tab': (event) => {
			if (!event.ctrlKey && !event.shiftKey && !event.altKey) {
				this.insertString("    ");
			}
		}
	};

	this.hotkeys = Object.assign(this.hotkeys, settings.hotkeys);

	this.triggerUndo = () => {
		if (undoState.length > 1) {
			redoState.push(this.textarea.value);
			this.textarea.value = undoState.pop();
		}
	}

	this.triggerRedo = () => {
		if (redoState.length) {
			undoState.push(this.textarea.value);
			this.textarea.value = redoState.pop();
		}
	}

	this.textarea.addEventListener('keyup', (keyboardEvent) => {
		if (keyboardEvent.key in this.hotkeys) {
			this.hotkeys[keyboardEvent.key](keyboardEvent);
		}
		if (settings.livePreview) {
			this.previewContainer.innerHTML = this.getHTML();
		}
		this.textarea.innerHTML = this.textarea.value;
	});

	this.textarea.addEventListener('keydown', (keyboardEvent) => {
		const key = keyboardEvent.key;
		if (key === " " || key === "Backspace" || key === "Delete") {
			// clear redo state
			if (redoState.length) {
				redoState = [];
			}

			if (undoState.length > maxSaveThreshold) {
				undoState.shift();
			}
			undoState.push(this.textarea.value);
		}
		if (keyboardEvent.ctrlKey && key === "z") {
			keyboardEvent.preventDefault();
			this.triggerUndo();
		}
		if (keyboardEvent.ctrlKey && key === "y") {
			keyboardEvent.preventDefault();
			this.triggerRedo();
		}
		if (key === "Tab") {
			keyboardEvent.preventDefault();
		}
	});

	// Toolbar
	var buttons = this.buttons = {
		"bold": {
			action: () => {
				this.addBracketToSelection("**", "**");
			},
			icon: "mdi mdi-format-bold",
			name: "format_bold",
			title: "Bold selection Ctrl + B"
		},
		"italic": {
			action: () => {
				this.addBracketToSelection("*", "*");
			},
			icon: "mdi mdi-format-italic",
			name: "format_italic",
			title: "Italic selection Ctrl + I"
		},
		"link": {
			action: () => {
				this.addBracketToSelection("[link_", "](put_your_link_url_here)");
			},
			icon: "mdi mdi-link-variant",
			name: "link", 
			title: "Add link Ctrl + L"
		},
		'blockquote': {
			action: () => {
				this.addPrefixToSelectedLine("> ");
			},
			icon: "mdi mdi-format-quote-close",
			name: "format_quote",
			title: "Blockquote Ctrl + Q"
		},
		'code': {
			action: () => {
				this.addBracketToSelection("```python\n", "\n```");
			},
			icon: "mdi mdi-code-braces",
			name: "code",
			title: "Code sample Ctrl + K"
		},
		'image': {
			action: () => {
				this.addBracketToSelection("![image](", ")");
			},
			icon: "mdi mdi-image",
			name: "image",
			title: "Image Ctrl + G"
		},
		'uploadImage': {
			action: () => {
				this.addBracketToSelection("![image](", ")");
			},
			icon: "mdi mdi-image-plus",
			name: "add_photo_alternate",
			title: "Upload Image"
		},
		'center': {
			action: () => {
				this.addBracketToSelection("<div align='center'>\n\n", "\n\n</div>");
			},
			icon: "mdi mdi-format-align-center",
			name: "format_align_center"
		},
		'ol': {
			action: () => {
				this.addOrderToSelectedLine();
			},
			icon: "mdi mdi-format-list-numbered",
			name: "format_list_numbered",
			title: "Numbered List Ctrl + O"
		},
		'ul': {
			action: () => {
				this.addPrefixToSelectedLine("- ");
			},
			icon: "mdi mdi-format-list-bulleted",
			name: "format_list_bulleted",
			title: "Bulleted List Ctrl + U"
		},
		'h1': {
			action: () => {
				this.addPrefixToSelectedLine("# ");
			},
			icon: "mdi mdi-format-header-1",
			name: "title"
		},
		'h2': {
			action: () => {
				this.addPrefixToSelectedLine("## ");
			},
			icon: "mdi mdi-format-header-2",
			name: "title"
		},
		'h3': {
			action: () => {
				this.addPrefixToSelectedLine("### ");
			},
			icon: "mdi mdi-format-header-3",
			name: "title"
		},
		'h4': {
			action: () => {
				this.addPrefixToSelectedLine("#### ");
			},
			icon: "mdi mdi-format-header-4",
			name: "title"
		},
		'h5': {
			action: () => {
				this.addPrefixToSelectedLine("##### ");
			},
			icon: "mdi mdi-format-header-5",
			name: "title"
		},
		'h6': {
			action: () => {
				this.addPrefixToSelectedLine("###### ");
			},
			icon: "mdi mdi-format-header-6",
			name: "title"
		},
		'undo': {
			action: () => {
				this.triggerUndo();
			},
			icon: "mdi mdi-undo",
			name: "undo",
			title: "Undo Ctrl + Z"
		},
		'redo': {
			action: () => {
				this.triggerRedo();
			},
			icon: "mdi mdi-redo",
			name: "redo",
			title: "Redo Ctrl + Y"
		},
	}

	this.initToolbar = () => {
		var toolbars = this.settings.toolbars;
		for (var toolName of toolbars) {
			if (toolName in buttons) {
				var buttonData = buttons[toolName];

				// Iconify
				var icon = document.createElement("span");
				icon.className += "iconify toolbar-button-icon "
				icon.setAttribute("data-icon", buttonData.icon.slice(4));
				icon.setAttribute("data-inline", "false");

				var button = document.createElement("button");
				button.onclick = buttonData.action;
				button.title = buttonData.title;
				button.type ="button";
				button.appendChild(icon);

				this.toolbar.appendChild(button);
			}
			else if (toolName === "|") {
				var hr = document.createElement("hr");
				hr.setAttribute("role", "separator");
				hr.setAttribute("aria-orientation", "vertical");
				hr.className += "toolbar-button-divider";

				this.toolbar.appendChild(hr);
			}
		}
	}

	this.initToolbar();

	// Preview
	if (settings.livePreview) {
		this.previewContainer.innerHTML = this.getHTML();
	}
}

if (typeof require === "function" && typeof exports === "object" && typeof module === "object")
{
	module.exports = chunchunmaru;
}
else
{ 
	window.chunchunmaru = chunchunmaru;
}
