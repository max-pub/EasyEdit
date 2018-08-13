class EasyEditColor {
    constructor(editor) {
        this.editor = editor;
        this.RE = {};
        this.editor.node.addEventListener('change', e => {
            // return;
            var lines = e.detail.lines;
            // console.log('highlight',lines);
            if (lines)
                lines.forEach(l => this.match(l))
            // this.match(lines[0]);

        })
    }
    load(f) {
        fetch(f).then(x => x.json()).then(x => {
            this.highlight(x);
            var lines = this.editor.lines().length;
            for(var i=1; i<=lines; i++)
                this.match(i)
            // var lines = [...Array(this.editor.lines().length).keys()]
        });
    }
    highlight(regex) {
        for (var key in regex)
            this.RE[key] = new RegExp(regex[key], "g");
    }
    match(i) {
        var t = performance.now();
        // console.log('check matches in line',i);
        // var line = this.editor.line(i);
        // console.log('-- in line',line);
        // var txt = line.content();
        var line = this.editor.node.querySelector('#L'+i);
        var txt = this.editor.doc[i];
        // console.log('match',line,txt);
        // console.log('-- in text',txt);
        var lineMatches = [],
            charMatches = [];
        for (var key in this.RE) {
            // var RE = new RegExp(this.RE[key], "g");
            var RE = this.RE[key];
            var match;
            while (match = RE.exec(txt)) {
                if (txt.length == match[0].length)
                    lineMatches.push([key, match[0]])
                else
                    charMatches.push([key, match[0], match.index, match.index + match[0].length]);
                // console.log('-- length',txt.length,match[0].length );
            }
        }
        // console.log('---- found',lineMatches, charMatches);
        console.log('matched', i, 'in time', Math.round(performance.now() - t));
        this.updateLine(line, lineMatches);
        this.updateChars(line, charMatches);
    }
    updateLine(line, update) {
        // var line = this.editor.line(i);
        var matchKeys = update.map(i => i[0]);
        line.querySelector('div').setAttribute('class', matchKeys.join(' '));
        line.setAttribute('class', matchKeys.map(m=>m+'-line').join(' '));

    }
    updateChars(line, update) {
        // console.log(i, update.map(u => u[0]).join(' '));
        // this.editor.line(i).children().forEach((c, n) => {
        line.querySelectorAll('s').forEach((c, n) => {
            c.setAttribute('class',
                update.filter(u => ((n >= u[2]) && (n < u[3]))).map(u => u[0]).join(' ')
            );
        });
    }
}






// console.log('---- updateChars', update);
// var chars = this.editor.line(i).children();
// var charClass = [];


// console.log('---- updateLine',update);
// var allKeys = Object.keys(this.RE);
// console.log('---- updateLine',allKeys,matchKeys);
// var CL = line.node.classList;
// allKeys.forEach(m=>matchKeys.includes(m)?CL.add(m):CL.remove(m));
// update.forEach(u=>CL.add(u[0]))