import { Header } from "./models/Header";
import { ConfigManager } from "./configManager";
import { TextDocument, window, Range } from "vscode";


export class HeaderManager {

    configManager = new ConfigManager();

    public getHeader(lineText: string) {
        let header = new Header(this.configManager.options.ANCHOR_MODE.value);

        let headerTextSplit = lineText.match(this.configManager.optionKeys.REGEXP_HEADER_META);

        if (headerTextSplit != null) {
            header.headerMark = headerTextSplit[1];
            header.orderedListString = headerTextSplit[2];
            header.dirtyTitle = headerTextSplit[4];
        }

        return header;
    }

    public getHeaderList() {
        let headerList: Header[] = [];
        let editor = window.activeTextEditor;

        if (editor != undefined) {
            let doc = editor.document;

            for (let index = 0; index < doc.lineCount; index++) {
                let lineText = this.getNextLineIsNotInCode(index, doc);

                let header = this.getHeader(lineText);

                if (header.isHeader) {
                    header.orderArray = this.calculateHeaderOrder(header, headerList);
                    header.range = new Range(index, 0, index, lineText.length);
                    headerList.push(header);
                }
            }
        }

        return headerList;
    }

    public getNextLineIsNotInCode(index: number, doc: TextDocument) {
        let lineText = doc.lineAt(index).text;

        let isCodeStyle1 = lineText.match(this.configManager.optionKeys.REGEXP_CODE_BLOCK1) != null;
        let isCodeStyle2 = lineText.match(this.configManager.optionKeys.REGEXP_CODE_BLOCK2) != null;

        let nextIndex = index;

        while (isCodeStyle1 || isCodeStyle2) {
            nextIndex = index + 1;

            let nextLine = doc.lineAt(nextIndex).text;

            isCodeStyle1 = nextLine.match(this.configManager.optionKeys.REGEXP_CODE_BLOCK1) != null;
            isCodeStyle2 = nextLine.match(this.configManager.optionKeys.REGEXP_CODE_BLOCK2) != null;
        }

        return doc.lineAt(nextIndex).text;
    }

    public calculateHeaderOrder(headerBeforePushToList: Header, headerList: Header[]) {

        if (headerList.length == 0) {
            // special case: First header
            let orderArray = new Array(headerBeforePushToList.depth);
            orderArray[headerBeforePushToList.depth - 1] = 1;
            return orderArray;
        }

        let lastheaderInList = headerList[headerList.length - 1];

        if (headerBeforePushToList.depth < lastheaderInList.depth) {
            // continue of the parent level
            let previousheader = headerList.find(header => header.depth == headerBeforePushToList.depth);

            if (previousheader != undefined) {
                let orderArray = Object.assign([], previousheader.orderArray);
                orderArray[orderArray.length - 1]++;

                return orderArray;
            } else {
                // special case: first header has greater level than second header
                let orderArray = new Array(headerBeforePushToList.depth);
                orderArray[headerBeforePushToList.depth - 1] = 1;
                return orderArray;
            }
        }

        if (headerBeforePushToList.depth > lastheaderInList.depth) {
            // child level of previous
            // order start with 1
            let orderArray = Object.assign([], lastheaderInList.orderArray);
            orderArray.push(1);

            return orderArray;
        }

        if (headerBeforePushToList.depth == lastheaderInList.depth) {
            // the same level, increase last item in orderArray
            let orderArray = Object.assign([], lastheaderInList.orderArray);
            orderArray[orderArray.length - 1]++;

            return orderArray;
        }

        return [];
    }
}