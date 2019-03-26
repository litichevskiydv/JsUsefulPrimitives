module.exports = class StringBuilder {
  constructor(defaultIdent) {
    this._defaultIdent = defaultIdent || 0;
    this._newLineSeparator = process.platform == "win32" ? "\r\n" : "\n";
    this._parts = [];
  }

  append(value) {
    if (value) this._parts.push(value);
    return this;
  }

  appendLine(value) {
    return this.append(value).append(this._newLineSeparator);
  }

  _generateIdent(ident) {
    return "  ".repeat(this._defaultIdent + (ident || 0));
  }

  appendIdented(value, ident) {
    return this.append(this._generateIdent(ident)).append(value);
  }

  appendLineIdented(value, ident) {
    return this.appendIdented(value, ident).append(this._newLineSeparator);
  }

  toString() {
    return this._parts.join("");
  }
};
