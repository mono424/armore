import React, { useState } from 'react';
import MonacoEditor from "react-monaco-editor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import hotkeys from "hotkeys-js";
import CookieBanner from "react-cookie-banner";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { faTimes, faSave, faFolderOpen, faLink, faFile, faTrash, faFileUpload, faExpand, faCompress, faPlay } from "@fortawesome/free-solid-svg-icons";

import api from './services/api';
import storage from './services/storage';
import Terminal from "./components/Terminal";
import './App.css';
import FuzzyOpen from './components/FuzzyOpen';
import DropZone from './components/DropZone';

hotkeys.filter = () => {
  return true;
};

library.add(
  fab,
  faTimes,
  faSave,
  faFolderOpen,
  faLink,
  faFile,
  faTrash,
  faFileUpload,
  faExpand,
  faCompress,
  faPlay
);

const sleep = t => new Promise(r => setTimeout(r, t));

const copyToClipboard = text => {
  if (window.clipboardData && window.clipboardData.setData) {
    // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
    return window.clipboardData.setData("Text", text);
  } else if (
    document.queryCommandSupported &&
    document.queryCommandSupported("copy")
  ) {
    var textarea = document.createElement("textarea");
    textarea.textContent = text;
    textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in Microsoft Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand("copy"); // Security exception may be thrown by some browsers.
    } catch (ex) {
      console.warn("Copy to clipboard failed.", ex);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
};

const getUrlArgs = () => {
  const args = window.location.href.split("#")[1];
  if (!args) return {};
  try {
    return JSON.parse(decodeURIComponent(atob(args)));
  } catch (e) {
    return {};
  }
};

const DEFAULT_CODE = `.data
msg:
.ascii "Hello Innsbruck!"
len = . - msg
.align
.global _start
_start:
MOV r0, #1
LDR r1, =msg
LDR r2, =len
MOV r7, #4
SWI #0

MOV r0, #0
MOV r7, #1
SWI #0
`;

function App() {
  let editorWrapRef = React.createRef();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [expanded, setExpanded] = useState(false);
  const [terminalopen, setTerminalopen] = useState(false);
  const [mobile, setMobile] = useState(window.screen.width < 600);
  const [terminaltext, setTerminaltext] = useState("");
  const [filename, setFilename] = useState("unknown.asm");
  const [filenameOpened, setFilenameOpened] = useState(null); // Last opened file; relevant for save lock; Ensures that existing files are not overwritten by mistake.
  const [editorwidth, setEditorwidth] = useState("100%");
  const [editorheight, setEditorheight] = useState("100%");
  const [openfileDialogOpen, setOpenfileDialogOpen] = useState(false);
  const filenameIsOpenedOne = filenameOpened === filename;

  const printOut = async (text, delay) => {
    await setTerminaltext(text);
    await sleep(delay);
  }

  const run = async () => {
    try {
      setTerminalopen(true);
      await printOut("Assembling...", 100);
      const assambleRes = await api.assamble(code);
      await printOut("Assembling ✔️", 200);
      await printOut("Linking ...", 100);
      const linkRes = await api.link(assambleRes.data.data.data);
      await printOut("Linking ✔️", 200);
      await printOut("Running ...", 200);
      const runRes = await api.exec(linkRes.data.data.data);
      setTerminaltext(runRes.data.data.join("\n"));
    } catch (error) {
      const respMsg = error.response && error.response.data.message;
      setTerminaltext(`**ERROR**\n\n${respMsg || error.message}`);
    }
  };

  const updateEditorSize = () => {
    const element = editorWrapRef.current;
    if (element) {
      setEditorwidth(
        element.offsetWidth
      );
      setEditorheight(
        element.offsetHeight
        - (terminalopen ? 220 : 0)
      );
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const copyLink = () => {
    const link = `${window.location.origin}#${btoa(encodeURIComponent(JSON.stringify({ code, filename })))}`;
    copyToClipboard(link);
    toast("URL copied to clipboard", { autoClose: 2500, className: 'toasty' });
  };

  const deleteFile = (fileName) => {
    storage.deleteFile(fileName);
    toast("File removed", { autoClose: 2500, className: "toasty" });
  };

  const saveFile = () => {
    if (!filenameIsOpenedOne && storage.files()[filename]) {
      return toast("File already exists!", { autoClose: 2500, className: "toasty" });
    }
    storage.saveFile(filename, code);
    toast("File saved", { autoClose: 2500, className: 'toasty' });
    setFilenameOpened(filename);
  };

  const openFile = fileName => {
    const file = storage.files()[fileName];
    setOpenfileDialogOpen(false);
    setFilename(fileName);
    setCode(file.code);
    setFilenameOpened(fileName);
  };

  const onFileDrop = file => {
    if (!/.asm$/i.test(file.name)) {
      return toast("Please only upload .asm-Files", {
        autoClose: 2500,
        className: "toasty"
      });
    }
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function(evt) {
      setFilename(file.name);
      setCode(evt.target.result);
      toast("File loaded!", {
        autoClose: 2500,
        className: "toasty"
      });
    };
  };

  React.useEffect(() => {
    updateEditorSize();    
  }, [expanded, terminalopen]);

  React.useEffect(() => {
    // Resize Editor on window resize
    const handleResize = () => {
      updateEditorSize();
    };
    window.onresize = handleResize;

    // HOTKEYS
    hotkeys.unbind("f5");
    hotkeys.unbind("ctrl+s");
    hotkeys.unbind("ctrl+o");
    hotkeys("f5", (e) => { e.preventDefault(); run(); });
    hotkeys("ctrl+s", (e) => { e.preventDefault(); saveFile(); });
    hotkeys("ctrl+o", (e) => { e.preventDefault(); setOpenfileDialogOpen(true); });
  });

  React.useEffect(() => {
    // URL ARGUMENTS
    const args = getUrlArgs();
    if (args.code) {
      setCode(args.code);
      setFilename(args.filename);
    }

    // if mobile
    if (mobile) {
      setExpanded(true);
    }
  }, []);

  return (
    <div className="App">
      <CookieBanner
        message="Yes, we use cookies... Now you are notified ;)"
        onAccept={() => {}}
        cookie="user-has-accepted-cookies" />
      <ToastContainer />
      {openfileDialogOpen && (
        <FuzzyOpen
          onSelect={openFile}
          onDelete={deleteFile}
          onClose={() => setOpenfileDialogOpen(false)}
        />
      )}
      {expanded || <div className="background-bar"></div>}
      <DropZone onDrop={onFileDrop}>
        <div className={"editor" + (expanded ? " expanded" : "")}>
          <header>
            <div className="main-head">
              <h1>
                ♥{" "}
                <span className="text">
                  ARM<i>ore</i>
                </span>
              </h1>
              <input
                className="filename"
                value={filename}
                onChange={e => setFilename(e.target.value)}
              />
            </div>
            <div className="controls">
              <button
                onClick={() => setOpenfileDialogOpen(true)}
                className="icon-btn"
              >
                <FontAwesomeIcon size="2x" icon="folder-open" />
              </button>
              <button onClick={saveFile} className="icon-btn">
                <FontAwesomeIcon size="2x" icon="save" />
              </button>
              <button onClick={copyLink} className="icon-btn">
                <FontAwesomeIcon size="2x" icon="link" />
              </button>
              <button
                onClick={run}
                className={"main-btn" + (mobile ? " mobile" : "")}
              >
                {!mobile ? "RUN" : <FontAwesomeIcon size="2x" icon="play" />}
              </button>
              {
                !mobile && 
                (<button onClick={toggleExpand} className="icon-btn">
                  <FontAwesomeIcon icon={expanded ? "compress" : "expand"} />
                </button>)
              }
            </div>
          </header>
          <div className="editor-inner-wrap" ref={editorWrapRef}>
            <MonacoEditor
              width={editorwidth}
              height={editorheight}
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={setCode}
            />
            {terminalopen && (
              <Terminal
                text={terminaltext}
                close={() => setTerminalopen(false)}
              />
            )}
          </div>
        </div>
      </DropZone>
      {expanded || (
        <footer>
          <a target="_blank" href="https://github.com/mono424/armore">
            <FontAwesomeIcon icon={["fab", "github"]} />
          </a>
          <span>
            handcrafted by
            <a target="_blank" href="https://khadimfall.com">
              Khadim Fall
            </a>
          </span>
        </footer>
      )}
    </div>
  );
}

export default App;
