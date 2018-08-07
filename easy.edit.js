class EasyEdit {

    constructor(node) {
        this.node = node;
        node.classList.add('EasyEdit');

        window.addEventListener('keydown', e => this.handleKeys(e));
        document.addEventListener("selectionchange", () => this.handleSelection());
        node.addEventListener('click', e => this.handleClick(e));
        node.addEventListener("paste", e => {
            console.log('paste', e);
            this.paste(e.clipboardData.getData("text/plain"));
        });

        this.STRING = {
            decode: s => s.replace(/\u00a0/g, " "),
            encode: s => s.replace(/\s/g, '&nbsp;')
        }

        this.HTML = {
            cursor: () => `<cursor></cursor>`,
            char: (c = '') => `<s>${this.STRING.encode(c)}</s>`,
            multipleChars: (s = '') => s.split('').map(c => this.HTML.char(c)).join(''),
            line: (s = '') => `<div>${this.HTML.multipleChars(s)}</div>`,
            fullLine: (s = '') => `<tr><td></td><td>${this.HTML.line(s)}</td></tr>`,
            multipleLines: (s = '') => s.split("\n").map(line => this.HTML.fullLine(line)).join("\n"),
        }
        this.initialContent();
    }

    initialContent() {
        this.node.style['white-space'] = 'pre';
        var content = this.node.innerText;
        console.log(content);
        // this.node.querySelector('table').innerHTML = ;
        this.node.innerHTML = `<table>${this.HTML.fullLine()}</table>`;
        this.line(1).cursor();
        if (content) setTimeout(() => this.paste(content), 10);
        this.node.style['white-space'] = 'nowrap';
    }


    // lineNumber(div) { return this.lines().indexOf(div) + 1; }
    lines() { return Array.from(this.node.querySelectorAll('td:nth-child(2)>div')) }
    line(i) {
        // var line = this.node.querySelectorAll('td:nth-child(2)>div').item(i-1);
        if (i * 1 == i) var line = this.lines()[i - 1];
        else line = i;
        if (!line) return;
        // console.log('line',line,line.innerText);
        return {
            node: line,
            content: s => s === undefined ? this.STRING.decode(line.innerText) : (line.innerHTML = this.HTML.line(s)),
            remove: () => line.closest('tr').remove(),
            cursor: () => this.cursor().put(line), //.insertAdjacentHTML('beforeend',this.cursor.markup),
            height: () => window.getComputedStyle(line).getPropertyValue('height').replace('px', '') * 1,
            next: () => this.DOM(line.closest('tr')).next('tr'),
            prev: () => this.DOM(line.closest('tr')).prev('tr'),
            children: () => Array.from(line.querySelectorAll('s')),
            number: () => this.lines().indexOf(line) + 1,
            char: j => {
                var char = line.querySelectorAll('s').item(j - 1)
                return {
                    node: char,
                    content: c => c === undefined ? this.STRING.decode(char.innerText) : (char.innerText = this.STRING.encode(c)),
                    remove: () => char.remove(),
                    cursor: () => this.cursor().put(char)
                }
            }
        }
    }


    handleClick(e) { // set cursor
        console.log('cick', e.target);
        var c = this.cursor();
        switch (e.target.nodeName) {
            case 'TD':
                return c.put(e.target.querySelector('DIV'), 1);
            case 'DIV':
                return c.put(e.target, 1);
            case 'S':
                return c.put(e.target, 1);
        }
    }
    cursor() {
        var cur = this.node.querySelector('cursor');
        var C = {
            node: cur,
            x: () => cur.offsetLeft,
            y: () => cur.offsetTop,
            line: () => this.line(cur.parentElement),
            // nextLine: () => this.DOM(cur.closest('tr')).next('tr')
            put: (node, pos) => {
                if (!node.nodeName) return;
                if (cur) cur.remove();
                if (node.nodeName == 'TD')
                    node = node.querySelector('div');
                if (node.nodeName == 'DIV')
                    node.insertAdjacentHTML(pos ? 'beforeend' : 'afterbegin', this.HTML.cursor());
                if (node.nodeName == 'S')
                    node.insertAdjacentHTML(pos ? 'afterend' : 'beforebegin', this.HTML.cursor());
            },
        }
        var node;
        var C2 = {
            allLeft: () => C.put(cur.parentElement, 0),
            allRight: () => C.put(cur.parentElement, 1),
            allUp: () => C.put(this.node.querySelector('tr:first-child div'), 0),
            allDown: () => C.put(this.node.querySelector('tr:last-child div'), 0),

            left: () => {
                if (node = this.DOM(cur).prev('s'))
                    return C.put(node, 0);
                if (node = this.DOM(cur.closest('tr')).prev('tr'))
                    return C.put(node.querySelector('div'), 1)
            },
            right: () => {
                if (node = this.DOM(cur).next('s'))
                    return C.put(node, 1);
                if (node = C.line().next())
                    return C.put(node.querySelector('div'), 0)
            },
            // below: () => document.elementFromPoint(C.x(), C.y() + C.line().height() + 5),
            up: () => { C.put(document.elementFromPoint(C.x(), C.y() - 5)) },
            down: () => { C.put(document.elementFromPoint(C.x(), C.y() + C.line().height() + 5)) }

        }
        return Object.assign({}, C, C2);
    }

    handleSelection() {
        // console.log('Selection changed.');
        // var node = this.selection().end();
        var sel = window.getSelection();
        if (sel.focusNode) this.cursor().put(sel.focusNode.parentElement, sel.focusOffset);
    }
    selection() {
        var sel = window.getSelection();
        return {
            content: () => sel.toString(),
            remove: () => sel.deleteFromDocument(),
            // start: () => sel.baseNode ? sel.baseNode.parentElement : null,
            // end: () => sel.focusNode ? sel.focusNode.parentElement : null,
        }
    }

    content(v) {
        if (v === undefined) // get content
            return this.lines().map(i => this.STRING.decode(i.innerText)).join("\n");

        // set content
        var htm = this.HTML.multipleLines(v); //markupFromPlain(v);
        this.node.querySelector('table').innerHTML = htm;
        setTimeout(this.fireChangeEvent.bind(this), 10);
    }



    handleKeys(e) {
        // console.log(e.code, e.key, e);
        var K = e.key;
        if (e.key.startsWith('Arrow')) {
            window.getSelection().removeAllRanges();
            if (e.metaKey)
                return this.cursor()['all' + e.key.replace('Arrow', '')]();
            else
                return this.cursor()[e.key.replace('Arrow', '').toLowerCase()]();
        }

        if (K == 'Backspace')
            return this.delChar();
        
        if (K == 'Enter')
            return this.paste("\n");

        if (!e.metaKey)
            if (!e.ctrlKey)
                this.addChar(e.key);

    }

    fireChangeEvent(lines) {
        // console.log('fire',lines);
        this.node.dispatchEvent(
            new CustomEvent('change', { detail: { lines: lines } })
        );
    }

    delChar() {
        var node;
        if (node = this.DOM(this.cursor().node).prev('s'))
            node.remove();
        this.fireChangeEvent([this.cursor().line().number()]);
    }
    addChar(key) {
        if (key.length > 1) return;
        // console.log('add',key);
        key = this.STRING.encode(key);
        this.cursor().node.insertAdjacentHTML('beforebegin', `<s>${key}</s>`);
        this.fireChangeEvent([this.cursor().line().number()]);
        // this.fireChangeEvent([this.lineNumber(this.cursor.node.closest('td>div'))]);
    }
    paste(txt) {
        var lines = txt.split("\n");
        this.cursor().node.insertAdjacentHTML('beforebegin',
            this.HTML.multipleChars(lines[0])
        );
        this.cursor().node.closest('tr').insertAdjacentHTML('afterend',
            this.HTML.multipleLines(lines.slice(1).join("\n"))
        );

        var afterCursor = document.querySelectorAll('cursor ~ s'); // stuff after cursor
        var changes = [this.cursor().line().number(), lines.length];
        this.line(changes[0] + changes[1] - 1).cursor(); // move cursor to new position
        var line = this.cursor().line().node; // get new cursor position
        afterCursor.forEach(n => line.insertBefore(n, null)); // insert old stuff after new cursor

        console.log('pasted lines', changes[0], changes[1]);
        this.fireChangeEvent([...Array(changes[1]).keys()].map(v => changes[0] + v));
    }



    DOM(currentNode) {
        return {
            prev: (nodeName) => {
                while (currentNode = currentNode.previousSibling)
                    if (currentNode && currentNode.nodeName == nodeName.toUpperCase())
                        return currentNode
            },
            next: (nodeName) => {
                while (currentNode = currentNode.nextSibling)
                    if (currentNode && currentNode.nodeName == nodeName.toUpperCase())
                        return currentNode
            },

        }
    }
}


