"use strict"; 

class markdown{
    constructor(config){
        this.content = this._sanatize(config.content).split("\n")
    }
    _isOl(data){
        if(data.charCodeAt(0) > 47 && data.charCodeAt(0) < 58){ // 1. through 9. 
            //Alright first character is a # let's keep going 
            var stPos = 0
            while(stPos < data.length){
                if(data.charCodeAt(stPos) > 47 && data.charCodeAt(stPos) < 58){ //We could in theory have infinite #'s this accounts for that. .
                    stPos++ 
                }
                else if(data.charCodeAt(stPos) === 0x2E){ // ol's end with a .
                    return true
                }
                else{
                    return false 
                }
            }
        }
    }
    _isUl(data){
        if((data.trim().charCodeAt(0) === 0x2D || data.trim().charCodeAt(0) === 0x2B || data.trim().charCodeAt(0) === 0x2A) && (data.trim().charCodeAt(1) === 0x20)){ //ul's must end in a space
            return true 
        }
        else{
            return false 
        }
    }
    returnHTML(){
        var html, previous, next, index, currLine
        html = ""
        //So our content is split into various lines so we're going to go through each fo them
        for(index = 0; index < this.content.length; index++){
            currLine = this.content[index]
            previous = this.content[index -1] 
            next = this.content[index + 1]
            //inline 
            if(currLine !== undefined){
                this._bold(currLine) ? currLine = this._bold(currLine) : ""
                this._underline(currLine) ? currLine = this._underline(currLine) : ""
                this._italics(currLine) ? currLine = this._italics(currLine) : ""
                this._code(currLine) ? currLine = this._code(currLine) : ""
                currLine = this._link(currLine)
                this._hr(currLine) ? html += this._hr(currLine) : ""
                this._break(currLine) ? html += this._break(currLine) : ""
                //List 
                if(this._list(currLine,previous,next)){
                    //Unordered List 
                    if(previous !== undefined){
                        if(!this._isUl(previous.trim()) && !this._isUl(previous.trim())){
                            if(this._isUl(currLine.trim())){
                                html += "<ul>"
                            }
                            if(this._isOl(currLine.trim())){
                                html += "<ol>"
                            }
                        }
                    } 
                    else { //This should in theory catch list at the start of a read 
                        if(this._isUl(currLine.trim())){
                            html += "<ul>"
                        }
                        if(this._isOl(currLine.trim())){
                            html += "<ol>"
                        }
                    } 
                    html += this._list(currLine,previous,next)
                    if(next !== undefined){
                        if(!this._isUl(next.trim()) && !this._isUl(next.trim())){
                            if(this._isUl(currLine.trim())){
                                html += "</ul>"
                            }
                            if(this._isOl(currLine.trim())){
                                html += "</ol>"
                            }
                        }
                    } 
                    else{ // This should catch list that are the end of a read 
                        if(this._isUl(currLine.trim())){
                            html += "</ul>"
                        }
                        if(this._isOl(currLine.trim())){
                            html += "</ol>"
                        }
                    }
                }
                //Block Elements 
                this._header(currLine) ? html += this._header(currLine) : "" 
                this._quote(currLine) ? html += this._quote(currLine) : ""
                this._paragaph(currLine) ? html += this._paragaph(currLine) : ""
                html += "\n"
            }
        };
        return html 
    }
    _sanatize(content){
        return content.replace(/[\<]/g,"&lt;")
    }
    //There's 2 states to this, it's either block, or inline. 
    //Block is the easist as it's the "Start" 
    _break(currLine){
        //easist of the set, if it's blank it's a Line break 
        var endPos = currLine.length 
        if(endPos === 0){
            return "<br />"
        }
        else {
            return false 
        }
    }
    _hr(currLine){
        //Again fairly easy --- or *** or ___ or more becomes <hr />
        var stPos = 0
        var endPos = currLine.length
        var ch = currLine.charCodeAt(stPos)
        if(ch !== 0x2A && ch !== 0x2D && ch !== 0x5F){ // *,-,_ are valid cahracters
            return false 
        }
        var count = 1
        ch = currLine.charCodeAt(++stPos)
        while(stPos < endPos){
            ch = currLine.charCodeAt(stPos)
            if(ch !== 0x2A && ch !== 0x2D && ch !== 0x5F && ch !== 0x20){
                return false //invalid character in there somewhere, we can have spaces though
            }
            else{
                stPos++
                (ch === 0x2A || ch === 0x2D || ch === 0x5F) ? count++ : ""
            }
        }
        if(count >= 3){
            return `<hr />`
        }
        else{
            return false 
        }
    }
    _header(currLine){
        var stPos = 0 
        var enPos = currLine.length
        //setup headers
        var ch = currLine.charCodeAt(stPos)
        if(ch !== 0x23){
            return false 
        }
        var level = 1
        ch = currLine.charCodeAt(++stPos)
        while(ch === 0x23 && stPos < enPos && level <= 6){
            //Header
            level++ 
            ch = currLine.charCodeAt(++stPos)
        } // This gets us what level of header it is (h1 > h6)
        currLine = currLine.slice(level)
        return `<h${level}>${currLine.trim()}</h${level}>`
    }
    _quote(currLine){
        //Quotes start with > so we're looking for 0x3E 
        var ch = currLine.charCodeAt(0)
        if(ch !== 0x3E){
            return false 
        }
        currLine = currLine.slice(1)
        return `<quote>${currLine}</quote>`
    }
    _paragaph(currLine){
        var ch = currLine.charCodeAt(0)
        if((ch > 47 && ch < 58) || (ch > 64 && ch < 91) || (ch > 96 && ch < 123 ) || (ch === 0x26) || (ch === 0x3c)){
            //basically the first character of the line has to be a letter, number OR * and _ 
            return `<p>${currLine}</p>`
        }
        else{
            return false 
        }
    }
    //List and Code both can span multiple lines 
    _list(currLine,previous,next){
        if((this._isUl(currLine.trim())) || (this._isOl(currLine.trim()))){
            //alright so it's an LI now... do we need to indent it? 
            var html = ""
            html += `<li>${currLine.trim().slice(2)}`
            //So let's build sub list 
            if(this._offset(next) > 0 && this._offset(currLine) < this._offset(next)){
                //means the next line is nested in this one 
                html += "<ul>"
            }
            else if((this._offset(currLine) > 0 && this._offset(currLine) > this._offset(next)) || (this._offset(currLine) > 0 && next === undefined) || (!this._isUl(currLine.trim()) && !this._isUl(currLine.trim()))){
                html += "</li></ul></li>" // If we're stepping back into the list OR the next line is empty 
            }
            else{
                html += "</li>"
            }
            return html 
        }
        else{
            return false //not an OL / LI of some kind 
        }
    }
    _offset(string){
        var offset = 0 
        if(string !== undefined){
            for(var i = 0; i < string.search(/(([\d]\.)|([\\*\-\\+]))\s/g); i++){
                string.charCodeAt(i) === 0x09 ? offset += 4 : ""
                string.charCodeAt(i) === 0x20 ? offset += 1 : "" 
            }
        }
        return offset
    }
    _link(currLine){
        //takes the line and extracts links and converts them
        //Format of links is (Link Text)[https://domain.tld], because this is markdown we're only going to assume http(s):// links are valid 
        //This basically has to be a regex, there's no real other way to do it
        return currLine.replace(/\[(.*?)\]\((http[s]?:\/\/.*?)\)/g,`<a href="$2">$1</a>`)
    }
    _bold(currLine){
        //so the way this works, if we split on the identifier (in this case **) we should have an array length whos module against 3 = 0
        //that is to say each "Correct" formating results in 3 array items
        currLine = currLine.split("**")
        if(currLine.length % 3 == 0){
            var html = ""
            //It indeed has something bold in there
            for(var i = 0; i < currLine.length; i++){
                //every second (or even one), we bold
                if(currLine[i] !== ""){
                    (i+1) % 2 == 0? html += `<strong>${currLine[i]}</strong>` : html += `${currLine[i]}`
                }
            }
            return html 
        }
        else{
            return false 
        }
    }
    _code(currLine){
        currLine = currLine.split("```")
        if(currLine.length % 3 == 0){
            var html = ""
            //It indeed has something underlined in there
            for(var i = 0; i < currLine.length; i++){
                //every second (or even one), we underline
                if(currLine[i] !== ""){
                    (i+1) % 2 == 0? html += `<code>${currLine[i]}</code>` : html += `${currLine[i]}`
                }
            }
            return html 
        }
        else{
            return false 
        }
    }
    _underline(currLine){
        currLine = currLine.split("_")
        if(currLine.length % 3 == 0){
            var html = ""
            //It indeed has something underlined in there
            for(var i = 0; i < currLine.length; i++){
                //every second (or even one), we underline
                if(currLine[i] !== ""){
                    (i+1) % 2 == 0? html += `<u>${currLine[i]}</u>` : html += `${currLine[i]}`
                }
            }
            return html 
        }
        else{
            return false 
        }
    }
    _italics(currLine){
        currLine = currLine.split("*")
        if(currLine.length % 3 == 0){
            var html = ""
            //It indeed has something underlined in there
            for(var i = 0; i < currLine.length; i++){
                //every second (or even one), we underline
                if(currLine[i] !== ""){
                    (i+1) % 2 == 0? html += `<em>${currLine[i]}</em>` : html += `${currLine[i]}`
                }
            }
            return html 
        }
        else{
            return false 
        }
    }

}
module.exports = markdown
