interface Type {
    name: string;
    type: string; // address, bool, bool[], bytes..., uint..., tuple 
    components?: Type[];
    internalType?: string;
}
interface Item {
    name: string;
    type: string; // event, constructor, function
    stateMutability: string;
    inputs?: Type[];
    outputs?: Type[];
}
interface Line {
    indent: number;
    text: string;
}
export interface IUserDefinedOptions {
    outputBytecode: boolean;
    hasBatchCall: boolean;
}
export default function(name: string, abiPath: string, abi: Item[], options: IUserDefinedOptions){
    if (abi.length) {
    let result = [];
    let events = {};
    let callFunctionNames: string[] = [];
    let txFunctionNames: string[] = [];
    let abiFunctionItemMap: Map<string, Item> = new Map();
    const addLine = function(indent: number, code: string): void {
        if (indent)
            result.push(`    `.repeat(indent) + code)
        else
            result.push(code);
    }

    const inputDataType = function(item: Type): string {
        let type = item.type;
        if (type == 'address' || type == 'string')
            return 'string';
        else if (/^(address|string)(\[\d*\])+$/.test(type))
            return type.replace("address","string").replace(/\d*/g,"");
        else if (type == 'bool')
            return 'boolean';
        else if (/^bool(\[\d*\])+$/.test(type))
            return type.replace("bool","boolean").replace(/\d*/g,"");
        else if (/^bytes\d*(\[\d*\])+$/.test(type))
            return type.replace(/bytes\d*/,"string").replace(/\d*/g,"");
        else if (/^bytes\d*$/.test(type))
            return 'string';
        else if (/^u?int\d*(\[\d*\])+$/.test(type))
            return type.replace(/^u?int\d*/,"(number|BigNumber)").replace(/\d*/g,"");
        else if (/^u?int\d*$/.test(type))
            return 'number|BigNumber';
        else if (type == 'tuple')
            return '{' + item.components.map((e,i)=>`${paramName(e.name,i)}:${inputDataType(e)}`).join(',') + '}';
        else if (/^tuple(\[\d*\])+$/.test(type))
            return '{' + item.components.map((e,i)=>`${paramName(e.name,i)}:${inputDataType(e)}`).join(',') + '}' + type.replace("tuple","").replace(/\d*/g,"");
        else
            return 'any';
    }
    const paramName = function(name: string, idx: number): string {
        if (name)
            return name.replace(/_/g,'');
        else
            return 'param' + (idx + 1);
    }
    const outputDataType = function(item: Type): string {
        let type = item.type;
        if (type == 'address' || type == 'string')
            return 'string';
        else if (/^(address|string)(\[\d*\])+$/.test(type))
            return type.replace("address","string").replace(/\d*/g,"");
        else if (type == 'bool')
            return 'boolean';
        else if (/^bool(\[\d*\])+$/.test(type))
            return type.replace("bool","boolean").replace(/\d*/g,"");
        else if (/^bytes\d*(\[\d*\])+$/.test(type))
            return type.replace(/bytes\d*/,"string").replace(/\d*/g,"");
        else if (/^bytes\d*$/.test(type))
            return 'string';
        else if (/^u?int\d*(\[\d*\])+$/.test(type))
            return type.replace(/^u?int\d*/,"BigNumber").replace(/\d*/g,"");
        else if (/^u?int\d*$/.test(type))
            return 'BigNumber';
        else if (type == 'tuple')
            return '{' + item.components.map((e,i)=>`${paramName(e.name,i)}:${outputDataType(e)}`).join(',') + '}';
        else if (/^tuple(\[\d*\])+$/.test(type))
            return '{' + item.components.map((e,i)=>`${paramName(e.name,i)}:${outputDataType(e)}`).join(',') + '}' + type.replace("tuple","").replace(/\d*/g,"");
        else
            return 'any';
    }
    const outputs = function(items: Type[], isEvent?: boolean): string {
        if (items.length > 1 || isEvent){
            let result = '{';
            for (let i = 0; i < items.length; i ++){
                if (i > 0)
                    result +=',';
                result += ((items[i].name ||`param${i+1}`)) + ':' + outputDataType(items[i]);
            }
            if (isEvent) {
                if (items.length > 0)
                    result +=',';
                result += "_event:Event";
            }
            result += '}'
            return result;
        }
        else if (items.length == 1){
            return outputDataType(items[0]);
        }
        else if (items.length == 0){
            return "void";
        }
        else
            return isEvent ? '{}' : 'any';
    }
    const capitalizeFirstLetter = function(value: string) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
    const getParamsInferfaceName = function(functionName: string) {
        return `I${functionName ? capitalizeFirstLetter(functionName) : 'Deploy'}Params`;
    }
    const inputs = function(functionName: string, item: Item): string {
        if (item.inputs.length == 0)
            return '';
        else if (item.inputs.length == 1){
            return `${paramName(item.inputs[0].name,0)}:${inputDataType(item.inputs[0])}`;
        }
        else{
            let interfaceName = getParamsInferfaceName(functionName);
            let result = `params: ${interfaceName}`;
            return result;
        }
    }
    const getParamsInterface = function(functionName: string, item: Item) {
        if (!item.inputs || item.inputs.length <= 1)
            return null;
        else {
            let interfaceName = getParamsInferfaceName(functionName);
            let result = `export interface ${interfaceName} {`;
            if (item.inputs){
                for (let i = 0; i < item.inputs.length; i ++){
                    if (i > 0)
                        result += ';';
                    result += `${paramName(item.inputs[i].name,i)}:${inputDataType(item.inputs[i])}`;
                }
            }
            return result+'}';
        }
    }
    const getParamsFunctionName = function(functionName: string) {
        return `${functionName}Params`;
    }
    const paramsFunction = function(functionName: string, item: Item) {
        if (item.inputs && item.inputs.length > 1) {
            let paramsFunctionName = getParamsFunctionName(functionName);
            let interfaceName = getParamsInferfaceName(functionName);
            addLine(2, `let ${paramsFunctionName} = (params: ${interfaceName}) => [${toSolidityInput(item)}];`);
        }
    }
    const toSolidityType = function(prefix: string, inputs: Type[]): string {
        let result = "";
        for (let i = 0 ; i < inputs.length ; i++) {
            if (i > 0)
                result += ',';
            if (/^u?int\d*(\[\d*\])*$/.test(inputs[i].type))
                result += `Utils.toString(${prefix}${paramName(inputs[i].name,i)})`;
            else if (inputs[i].type == 'tuple')
                result += expendTuple(`${prefix}${paramName(inputs[i].name,i)}.`, inputs[i]);
            else if (/^tuple(\[\d*\])+$/.test(inputs[i].type))
                result += `${prefix}${paramName(inputs[i].name,i)}` +
                          inputs[i].type.match(/(\[\d*\])/g).map((e,i,a)=>i==a.length-1 ? `.map(e=>(` : `.map(a${i}=>a${i}`).join("") +
                          `${expendTuple("e.", inputs[i])}`+
                          inputs[i].type.match(/(\[\d*\])/g).map((e,i)=>i==0?"))":")").join("");
            else if (/^bytes32(\[\d*\])*$/.test(inputs[i].type))
                result += `Utils.stringToBytes32(${prefix}${paramName(inputs[i].name,i)})`;
            else if (/^bytes(\[\d*\])*$/.test(inputs[i].type))
                result += `Utils.stringToBytes(${prefix}${paramName(inputs[i].name,i)})`;
            else
                result += `${prefix}${paramName(inputs[i].name,i)}`;
        }
        return result;
    }
    const expendTuple = function(parent: string, tuple: Type): string {
        let result = '[' + toSolidityType(parent, tuple.components) + ']';
        return result;
    }
    const toSolidityInput = function(item: Item): string {
        let prefix = item.inputs.length > 1 ? "params." : "";
        let result = toSolidityType(prefix, item.inputs);
        return result;
    }
    const payable = function(item: Item): string {
        if (item.stateMutability=='payable') {
            return (item.inputs.length == 0 ? '':',') + '_value:number|BigNumber';
        } else {
            return '';
        }
    }
    const returnOutputsItem = function(item: Type, isEvent: boolean, objPath: string, indent: number): Line[] {
        let newLines;
        if (item.type == 'tuple') {
            newLines = [{indent:indent, text:""}, // reserved for "[name]:" or "{name:"
                       ...returnOutputs(item.components, false, isEvent, objPath, indent),
                       {indent:indent, text: ""}]; // reserved for "}"
        }
        else if (/^tuple(\[\d*\])+$/.test(item.type)){
            newLines = [{indent:indent, text:objPath+ item.type.match(/(\[\d*\])/g).map((e,i,a)=>i==a.length-1 ? `.map(e=>(` :`.map(a${i}=>a${i}`).join("")},
                        ...returnOutputs(item.components, false, isEvent, "e", indent+1),
                       {indent:indent, text:item.type.match(/(\[\d*\])/g).map((e,i)=>i==0?"))":")").join("")}];
        }
        else{
            let line;
            if (outputDataType(item) == 'BigNumber')
                line = `new BigNumber(${objPath})`;
            else if (/^BigNumber(\[\d*\])+$/.test(outputDataType(item)))
                line = `${objPath}`+ item.type.match(/(\[\d*\])/g).map((e,i,a)=>i==a.length-1 ? `.map(e=>` :`.map(a${i}=>a${i}`).join("") + `new BigNumber(e)` + item.type.match(/(\[\d*\])/g).map((e,i)=>")").join("");
            else
                line = `${objPath}`;
            newLines = [{indent:indent, text:line}];
        }
        return newLines;
    }
    const returnOutputs = function(items: Type[], addReturn: boolean, isEvent?: boolean, parent?: string, indent?: number): Line[] {
        parent = parent || "result";
        indent = indent || 0;
        let lines = []
        if (items.length > 1 || (isEvent)){
            lines.push({indent:indent, text:addReturn?"return {":"{"});
            indent = indent + 1;
            for (let i = 0; i < items.length; i ++){
                let item = items[i];
                let objPath = parent + (item.name ? `.${item.name}` : `[${i}]`);
                let newLines = returnOutputsItem(items[i], isEvent, objPath, indent);
                newLines[0].text = (item.name || `param${i + 1}`) + ": " + newLines[0].text;
                if ((addReturn && isEvent) || i < items.length -1)
                    newLines[newLines.length-1].text+=','
                lines = [...lines, ...newLines];
            }
            if (addReturn && isEvent)
                lines.push({indent:indent, text:"_event: event"});
            lines.push({indent:indent-1, text:addReturn?"};":"}"});
        }
        else if (items.length == 1){
            let item = items[0];
            let objPath = parent + (indent ? (((!isEvent) && item.name) ? `.${item.name}` : `[0]`) : "");
            let newLines = returnOutputsItem(items[0], isEvent, objPath, indent);
            if (addReturn){
                newLines[0].text = "return " + (newLines.length>1?"(":"") + newLines[0].text;
                newLines[newLines.length-1].text = newLines[newLines.length-1].text + (newLines.length>1?")":"") + ";"
            } else {
                newLines[0].text =  "{" + (item.name ? `${item.name}` : `param1`) + ": " + newLines[0].text;
                newLines[newLines.length-1].text = newLines[newLines.length-1].text + "}"
            }
            lines = newLines;
        }
        else if (items.length == 0){
            lines.push({indent:indent, text:(addReturn?"return;":"")});
        }
        else
            lines.push({indent:indent, text:(addReturn?"return ":"")+'{}'+(addReturn?";":"")});
        return lines;
    }

    let functionNames = {};
    const callFunction = function(name: string, item: Item): void {
        let input = "";
        if (item.inputs.length == 1) {
            input = `,[${toSolidityInput(item)}]`;
        }
        else if (item.inputs.length > 1) {
            input = `,[${getParamsFunctionName(item.name)}(params)]`;
        }
        let _payable = item.stateMutability=='payable'?((item.inputs.length==0?", []":"")+', {value:_value}'):'';
        let args = `${inputs(item.name, item)}${payable(item)}`;
        addLine(2, `let ${name} = async (${args}): Promise<${outputs(item.outputs)}> => {`);
        addLine(3, `let result = await this.call('${item.name}'${input}${_payable});`);
        returnOutputs(item.outputs, true).forEach((e,i,a)=>addLine(e.indent+3, e.text));
        addLine(2, '}');
    }
    const batchCallFunction = function(name: string, item: Item): void {
        let input = "";
        if (item.inputs.length == 1) {
            input = `,[${toSolidityInput(item)}]`;
        }
        else if (item.inputs.length > 1) {
            input = `,[${getParamsFunctionName(item.name)}(params)]`;
        }
        let _payable = item.stateMutability=='payable'?((item.inputs.length==0?", []":"")+', {value:_value}'):'';
        let args = `${inputs(item.name, item)}${payable(item)}`;
        let batchCallArgs = `batchObj: IBatchRequestObj, key: string` + (args.length == 0 ? '' : `, ${args}`);
        addLine(2, `let ${name} = async (${batchCallArgs}): Promise<void> => {`);
        addLine(3, `await this.batchCall(batchObj, key, '${item.name}'${input}${_payable});`);
        addLine(2, '}');
    }
    const sendFunction = function(name: string, item: Item): void { 
        let input = "";
        if (item.inputs.length == 1) {
            input = `,[${toSolidityInput(item)}]`;
        }
        else if (item.inputs.length > 1) {
            input = `,[${getParamsFunctionName(item.name)}(params)]`;
        }
        let _payable = item.stateMutability=='payable'?((item.inputs.length==0?", []":"")+', {value:_value}'):'';
        let args = `${inputs(item.name, item)}${payable(item)}`;
        addLine(2, `let ${name} = async (${args}): Promise<TransactionReceipt> => {`);
        addLine(3, `let result = await this.send('${item.name}'${input}${_payable});`);
        addLine(3, 'return result;')
        addLine(2, '}');
    }
    const addFunction = function(functionName: string, item: Item): void {
        let constantFunction = (item.stateMutability == 'view' || item.stateMutability == 'pure')
        let batchCallArgs = `batchObj: IBatchRequestObj, key: string` + (args.length == 0 ? '' : `, ${args}`);
        if (constantFunction){
            let args = `${inputs(functionName, item)}${payable(item)}`;
            addLine(1, `${functionName}: {`);
            addLine(2, `(${args}): Promise<${outputs(item.outputs)}>;`);
            if (options.hasBatchCall) {
                addLine(2, `batchCall: (${batchCallArgs}) => Promise<void>;`);
            }
            addLine(1, `}`);
        } else {
            let args = `${inputs(functionName, item)}${payable(item)}`;
            addLine(1, `${functionName}: {`);
            addLine(2, `(${args}): Promise<TransactionReceipt>;`);
            addLine(2, `call: (${args}) => Promise<${outputs(item.outputs)}>;`);
            if (options.hasBatchCall) {
                addLine(2, `batchCall: (${batchCallArgs}) => Promise<void>;`);
            }
            addLine(1, `}`);       
        }
    }
    const addEvent = function(item: Item): void {
        let eventItems = item.inputs;
        events[item.name] = outputs(eventItems, true);
        addLine(1, `parse${item.name}Event(receipt: TransactionReceipt): ${name}.${item.name}Event[]{`);
        addLine(2, `return this.parseEvents(receipt, "${item.name}").map(e=>this.decode${item.name}Event(e));`);
        addLine(1, '}');
        addLine(1, `decode${item.name}Event(event: Event): ${name}.${item.name}Event{`);
        // addLine(2, `let events = this.decodeEvent(log, "${item.name}");`);
        // addLine(2, `return events.map(event => {`);
        addLine(2, `let result = event.data;`);
        returnOutputs(eventItems, true, true).forEach((e,i,a)=>addLine(e.indent+2, e.text));
        // addLine(2, '});');
        addLine(1, '}');
    }
    const addDeployer = function(abi: Item[]): void {
        let item = abi.find(e=>e.type=='constructor');
        if (item) {
            let input = (item.inputs.length > 0) ? `[${toSolidityInput(item)}]` : "";
            let _payable = item.stateMutability=='payable'?((item.inputs.length==0?", []":"")+', {value:_value}'):'';
            addLine(1, `deploy(${inputs(item.name, item)}${payable(item)}): Promise<string>{`);
            addLine(2, `return this.__deploy(${input}${_payable});`);
            addLine(1, `}`);
        } else {
            addLine(1, `deploy(): Promise<string>{`);
            addLine(2, `return this.__deploy();`);
            addLine(1, `}`);
        }
    }
    const addParamsInterface = function(item: Item): void {
        let name = item.name;
        if (name) {
            let counter = 1;
            while(functionNames[name]){
                name = name + "_" + counter;
                counter++;
            }
            functionNames[name] = true;
            let constantFunction = (item.stateMutability == 'view' || item.stateMutability == 'pure')
            abiFunctionItemMap.set(name, item);
            if (constantFunction){
                callFunctionNames.push(name);
            }
            else {
                txFunctionNames.push(name); 
            }
        }
        let paramsInterface = getParamsInterface(name, item);
        if (paramsInterface) {
            addLine(0, paramsInterface);
        } 
    }
    addLine(0, `import {IWallet, Contract, Transaction, TransactionReceipt, Utils, BigNumber, Event, IBatchRequestObj} from "@ijstech/eth-wallet";`);
    addLine(0, `import Bin from "${abiPath}${name}.json";`);
    addLine(0, ``);
    for (let i = 0; i < abi.length; i++) {
        if (abi[i].type != 'function' && abi[i].type != 'constructor') continue;
        addParamsInterface(abi[i]);
    }
    addLine(0, `export class ${name} extends Contract{`);
    addLine(1, `constructor(wallet: IWallet, address?: string){`);
    addLine(2, options.outputBytecode ? `super(wallet, address, Bin.abi, Bin.bytecode);` : `super(wallet, address, Bin.abi);`);
    addLine(2, `this.assign()`);
    addLine(1, `}`);
    if (options.outputBytecode)
        addDeployer(abi);
    let eventAbiItems = abi.filter(v => v.type == 'event');
    for (let i = 0; i < eventAbiItems.length; i++) {
        addEvent(eventAbiItems[i]);
    }
    abiFunctionItemMap.forEach((item, name) => {
        addFunction(name, item);
    })
    addLine(1, `private assign(){`);
    for (let i = 0 ; i < callFunctionNames.length ; i++) {
        let functionName = callFunctionNames[i];
        let abiItem = abiFunctionItemMap.get(functionName);
        paramsFunction(functionName, abiItem);
        callFunction(functionName+"_call", abiItem);
        if (options.hasBatchCall) {
            batchCallFunction(functionName+"_batchCall", abiItem);
            addLine(2, `this.${functionName} = Object.assign(${functionName}_call, {`);
            addLine(3, `batchCall:${functionName}_batchCall`);
            addLine(2, `});`)
        }
        else {
            addLine(2, `this.${functionName} = ${functionName}_call`);
        };
    }
    for (let i = 0 ; i < txFunctionNames.length ; i++) {
        let functionName = txFunctionNames[i];
        let abiItem = abiFunctionItemMap.get(functionName);
        paramsFunction(functionName, abiItem);
        sendFunction(functionName+"_send", abiItem);
        callFunction(functionName+"_call", abiItem);
        if (options.hasBatchCall) {
            batchCallFunction(functionName+"_batchCall", abiItem);
        }
        addLine(2, `this.${functionName} = Object.assign(${functionName}_send, {`);
        if (options.hasBatchCall) {
            addLine(3, `call:${functionName}_call, batchCall:${functionName}_batchCall`);
        }
        else {
            addLine(3, `call:${functionName}_call`);
        }
        addLine(2, `});`);
    }
    addLine(1, `}`);
    addLine(0, `}`);
    if (Object.keys(events).length) {
        addLine(0, `export module ${name}{`);
        for (let e in events)
            addLine(1, `export interface ${e}Event ${events[e]}`);
        addLine(0, `}`);
    }
    return result.join('\n');
    }
}
