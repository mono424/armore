export default {

  files() {
    return JSON.parse(localStorage.getItem('files') || '{}');
  },

  saveFile(fileName, code) {
    return localStorage.setItem("files", JSON.stringify({
      ...this.files(),
      ...{
        [fileName]: { code }
      }
    }));
  },

  deleteFile(fileName, code) {
    return localStorage.setItem("files", JSON.stringify({
      ...this.files(),
      [fileName]: undefined
    }));
  },

};
