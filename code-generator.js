/*
 * Copyright (c) 2014-2018 MKLab. All rights reserved.
 * Copyright (c) 2014 Sebastian Schleemilch.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

var _CPP_CODE_GEN_H = "h";
var _CPP_CODE_GEN_CPP = "m";

var _CPP_PUBLIC_MOD = "public";
var _CPP_PROTECTED_MOD = "protected";
var _CPP_PRIVATE_MOD = "private";

const path = require('path')
const fs = require('fs')
const codegen = require('./codegen-utils')

var copyrightHeader = "";
var versionString = "v0.0.1";

/**
 * Cpp code generator
 */
class CppCodeGenerator {
    /**
     * @constructor
     *
     * @param {type.UMLPackage} baseModel
     * @param {string} basePath generated files and directories to be placed
     *
     */
    constructor (baseModel, basePath) {
        /** @member {type.Model} */
        this.baseModel = baseModel

        /** @member {string} */
        this.basePath = basePath

        let doc = '//'

        doc += '\n//  %FILENAME%'

        let projectName = app.project.getProject().name
        if (!projectName || projectName.length == 0) {
            projectName = 'Project Name'
        }
        doc += '\n//  ' + app.project.getProject().name

        doc += '\n//'

        let author = app.project.getProject().author
        if (!author || author.length == 0) {
            author = 'StarUML'
        }
        let [date, time] = new Date().toLocaleString('zh-Hans-CN', {hour12: false}).split(', ')
        doc += '\n//  Created by ' + author + " on " + date

        let copyright = app.project.getProject().copyright
        if (!copyright || copyright.length == 0) {
            copyright = ''
        }
        doc += '\n//  Copyright © '+ copyright +'. All rights reserved. \n//\n'
        copyrightHeader = doc
    }

    /**
     * Return Indent String based on options
     * @param {Object} options
     * @return {string}
     */
    getIndentString (options) {
        if (options.useTab) {
            return '\t'
        } else {
            var i, len
            var indent = []
            for (i = 0, len = options.indentSpaces; i < len; i++) {
                indent.push(' ')
            }
            return indent.join('')
        }
    }

    generate (elem, basePath, options) {
        this.genOptions = options

        var getFilePath = (extenstions) => {
            var absPath = basePath + '/' + elem.name.replace(/\s\*/, "") + '.'
            if (extenstions === _CPP_CODE_GEN_H) {
                absPath += _CPP_CODE_GEN_H
            } else {
                absPath += _CPP_CODE_GEN_CPP
            }
            return absPath
        }

        var indentString = this.getIndentString(options)

        //数组+map  
        var titleCase = function (s) {
            return s.split(/\s+/).map(function(item, index) {  
                return item.slice(0, 1).toUpperCase() + item.slice(1);  
            }).join(' ');
        }  

        var writeEnumeration = function (codeWriter, elem, cppCodeGen) {
            var i;
            var modifierList = cppCodeGen.getModifiers(elem);
            var modifierStr = "";
            for (i = 0; i < modifierList.length; i++) {
                modifierStr += modifierList[i] + " ";
            }

            if (elem.documentation.length > 0) {
                codeWriter.writeLine('/**\n' + " " + elem.documentation + '\n')

                const litLength = elem.literals.length
                for (let i = 0; i < litLength; i++) {
                    codeWriter.writeLine(' - ' + elem.literals[i].name + ': ' + elem.literals[i].documentation)
                }
                codeWriter.writeLine(' */')
            }

            codeWriter.writeLine(modifierStr + 'typedef NS_ENUM(NSInteger, ' + elem.name +
                ') {\n' + elem.literals.map(lit => indentString + elem.name + titleCase(lit.name)).join(',\t\n') + '\n};')
        }

        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hour = date.getHours();
        var minute = date.getMinutes();
        var second = date.getSeconds();

        var writeClassHeader = function (codeWriter, elem, cppCodeGen, isPrivate) {
            var i;
            var tmpIsPrivate = isPrivate ? isPrivate : false;
            var write = function (items) {
                var i;

                // TODO: put Enumeration on top

                for (i = 0; i < items.length; i++) {
                    var item = items[i];

                    if (item instanceof type.UMLAttribute ||  item instanceof type.UMLAssociationEnd) { // if write member variable
                        codeWriter.writeLine(cppCodeGen.getMemberVariable(item));
                    } else if (item instanceof type.UMLEnumeration) {
                        writeEnumeration(codeWriter, item, cppCodeGen);
                    } else if (item instanceof type.UMLOperation) { // if write method
                        codeWriter.writeLine(cppCodeGen.getMethod(item, false));
                    } else if (item instanceof type.UMLClass) {
                        writeClassHeader(codeWriter, item, cppCodeGen);
                    }
                }
            };
            var writeInheritance = function (elem, isPrivate) {
                if (isPrivate) {
                    return "()";
                }
                var inheritString = ": ";
                var genList = cppCodeGen.getSuperClasses(elem);

                if (genList.length === 0) {
                    return ": NSObject";
                }

                var i;
                var term = [];

                if (genList.length > 0) {
                    var generalization = genList[0];
                    inheritString += generalization.target.name + " ";
                }

                for (i = 1; i < genList.length; i++) {
                    var general = genList[i];
                    // public AAA, private BBB
                    term.push(general.target.name);
                }
                if (term.length > 0) {
                    inheritString += "<";
                    inheritString += term[0];
                    inheritString += ">";
                }
                return inheritString;
            };
            var writeProtocol = function (elem, isPrivate) {

                var inheritString = "";
                var genList = cppCodeGen.getSuperClasses(elem);

                var i;
                var term = [];

                for (i = 0; i < genList.length; i++) {
                    var general = genList[i];
                    // public AAA, private BBB
                    term.push(general.target.name);
                }
                if (term.length > 0) {
                    inheritString += "<";
                    inheritString += term[0];
                    inheritString += ">";
                }
                return inheritString;
            };

            // member variable
            var memberAttr = elem.attributes.slice(0);
            var associations = app.repository.getRelationshipsOf(elem, function (rel) {
                return (rel instanceof type.UMLAssociation);
            });
            for (i = 0; i < associations.length; i++) {
                var asso = associations[i];
                if (asso.end1.reference === elem && asso.end2.navigable === true && asso.end2.name.length !== 0) {
                    memberAttr.push(asso.end2);
                } else if (asso.end2.reference === elem && asso.end1.navigable === true && asso.end1.name.length !== 0) {
                    memberAttr.push(asso.end1);
                }
            }

            // method
            var methodList = elem.operations.slice(0);
            var innerElement = [];
            for (i = 0; i < elem.ownedElements.length; i++) {
                var element = elem.ownedElements[i];
                if (element instanceof type.UMLClass || element instanceof type.UMLEnumeration) {
                    innerElement.push(element);
                }
            }

            var allMembers = memberAttr.concat(methodList).concat(innerElement);

            var classfiedAttributes = cppCodeGen.classifyVisibility(allMembers);


            var finalModifier = "";
            if (elem.isFinalSpecialization === true || elem.isLeaf === true) {
                finalModifier = " final ";
            }
            var templatePart = cppCodeGen.getTemplateParameter(elem);
            if (templatePart.length > 0) {
                codeWriter.writeLine(templatePart);
            }

            let mainName = elem.name.replace("\*","").replace(" ","");

            var brief = mainName + ' Interface';
            if (elem.documentation.length > 0) {
                brief = elem.documentation;
            }

            let [date, time] = new Date().toLocaleString('zh-Hans-CN', {hour12: false}).split(', ')
            var docs = brief + '\n\n@author: '+ app.project.getProject().author +' \n@version: 1.0\n@date: ' + date + '\n';

            codeWriter.writeLine(cppCodeGen.getDocuments(docs));

            if (elem instanceof type.UMLInterface) {
                codeWriter.writeLine("@protocol " + mainName + " <NSObject>");
            } else if ( elem instanceof type.UMLClass &&  elem.ownedElements.length > 0){
                var genList = cppCodeGen.getSuperClasses(elem);
                if (elem.ownedElements[0] instanceof type.UMLInterfaceRealization && !tmpIsPrivate) {
                    codeWriter.writeLine("@interface " + mainName + ": NSObject "+ writeProtocol(elem, tmpIsPrivate));
                } else {
                    codeWriter.writeLine("@interface " + mainName + finalModifier + writeInheritance(elem, tmpIsPrivate));
                }
                codeWriter.writeLine()
            } else {
                codeWriter.writeLine("@interface " + mainName + finalModifier + writeInheritance(elem, tmpIsPrivate));
            }

            if (classfiedAttributes._public.length > 0 && !tmpIsPrivate) {
                write(classfiedAttributes._public);
            } else {
                codeWriter.writeLine("\n");
            }
            if (classfiedAttributes._protected.length > 0 && !tmpIsPrivate) {
                write(classfiedAttributes._protected);
            }

            if (classfiedAttributes._private.length > 0 && tmpIsPrivate) {
                write(classfiedAttributes._private);
            }

            codeWriter.writeLine("\n@end\n");
        };

        var writeClassBody = function (codeWriter, elem, cppCodeGen) {
            var i = 0;
            var item;
            var writeClassMethod = function (elemList) {

                for (i = 0; i < elemList._public.length; i++) {
                    item = elemList._public[i];
                    if (item instanceof type.UMLOperation) { // if write method
                        codeWriter.writeLine(cppCodeGen.getMethod(item, true));
                    } else if (item instanceof type.UMLClass) {
                        writeClassBody(codeWriter, item, cppCodeGen);
                    }
                }

                for (i = 0; i < elemList._protected.length; i++) {
                    item = elemList._protected[i];
                    if (item instanceof type.UMLOperation) { // if write method
                        codeWriter.writeLine(cppCodeGen.getMethod(item, true));
                    } else if (item instanceof type.UMLClass) {
                        writeClassBody(codeWriter, item, cppCodeGen);
                    }
                }

                for (i = 0; i < elemList._private.length; i++) {
                    item = elemList._private[i];
                    if (item instanceof type.UMLOperation) { // if write method
                        codeWriter.writeLine(cppCodeGen.getMethod(item, true));
                    } else if (item instanceof type.UMLClass) {
                        writeClassBody(codeWriter, item, cppCodeGen);
                    }
                }
            };

            // parsing class
            var methodList = cppCodeGen.classifyVisibility(elem.operations.slice(0));

            // parsing nested class
            var innerClass = [];
            for (i = 0; i < elem.ownedElements.length; i++) {
                var element = elem.ownedElements[i];
                if (element instanceof type.UMLClass) {
                    innerClass.push(element);
                }
            }
            if (innerClass.length > 0) {
                innerClass = cppCodeGen.classifyVisibility(innerClass);
                writeClassMethod(innerClass);
            }

            if (!elem.isAbstract) {
                // General private @interface
                writeClassHeader(codeWriter, elem, cppCodeGen, true);
            }

            // General @implementation
            codeWriter.writeLine('@implementation ' + elem.name.replace("\*","").replace(" ","") + '\n\n');


            // General methods
            writeClassMethod(methodList);

            var _extends = cppCodeGen.getSuperClasses(elem);

            // Extends methods
            var extendsMethodList = [];
            extendsMethodList._public = [];
            extendsMethodList._protected = [];
            extendsMethodList._private = [];
            var extendsClassName;
            if (_extends.length > 0 && (_extends[0].target instanceof type.UMLClass ||
                _extends[0].target instanceof type.UMLInterface)) {
                if (_extends.length > 0 && _extends[0].target.operations.length > 0) {
                    var len = _extends[0].target.operations.length;
                    var found = false;
                    for (i = 0; i < len; i++) {
                        var _modifiers = cppCodeGen.getModifiers(_extends[0].target.operations[i]);
                        if( _modifiers.includes("virtual") === true ) {
                            extendsClassName = _extends[0].target.name;
                            extendsMethodList._public.push(_extends[0].target.operations[i]);
                        }
                    }
                }
            }

            // General super class abstract methods
            if (extendsMethodList._public.length > 0) {
                codeWriter.writeLine('\n#pragma mark - Extends from ' + extendsClassName);
                writeClassMethod(extendsMethodList);
            }

            if (elem.ownedElements.length > 0 && elem.ownedElements[0] instanceof type.UMLInterfaceRealization) {
                codeWriter.writeLine('\n#pragma mark - Implementation for ' + elem.ownedElements[0].target.name);
                var methodList = cppCodeGen.classifyVisibility(elem.ownedElements[0].target.operations.slice(0));
                writeClassMethod(methodList);
            }

            codeWriter.writeLine('\n@end');
        };

        var result = new $.Deferred(),
            self = this,
            fullPath,
            directory,
            file;

        // Package -> as namespace or not
        if (elem instanceof type.UMLPackage) {
            fullPath = path.join(basePath, elem.name)

            if (fs.existsSync(fullPath)) {
                let buttonId = app.dialogs.showConfirmDialog("Same package has existed, did you want to remove it?")
                if (buttonId == 'ok') {
                    deleteFolderRecursive(fullPath)
                }
                else {
                    return
                }
            }

            fs.mkdirSync(fullPath)
            if (Array.isArray(elem.ownedElements)) {
                elem.ownedElements.forEach(child => {
                    return this.generate(child, fullPath, options)
                })
            }

        } else if (elem instanceof type.UMLClass) {

            // generate elem_name.h
            file = getFilePath(_CPP_CODE_GEN_H)
            fs.writeFileSync(file, this.writeHeaderSkeletonCode(elem, options, writeClassHeader))
            // generate elem_name.m
            if (options.genImpl) {
                file = getFilePath(_CPP_CODE_GEN_CPP)
                fs.writeFileSync(file, this.writeBodySkeletonCode(elem, options, writeClassBody))
            }

        } else if (elem instanceof type.UMLInterface) {
            /*
             * interface will convert to class which only contains virtual method and member variable.
             */
            // generate interface header ONLY elem_name.h
            file = getFilePath(_CPP_CODE_GEN_H)
            fs.writeFileSync(file, this.writeHeaderSkeletonCode(elem, options, writeClassHeader))

        } else if (elem instanceof type.UMLEnumeration) {
            // generate enumeration header ONLY elem_name.h
            file = getFilePath(_CPP_CODE_GEN_H)
            fs.writeFileSync(file, this.writeHeaderSkeletonCode(elem, options, writeEnumeration))
        }
    }

    /**
     * Write *.h file. Implement functor to each uml type.
     * Returns text
     *
     * @param {Object} elem
     * @param {Object} options
     * @param {Object} functor
     * @return {Object} string
     */
    writeHeaderSkeletonCode (elem, options, funct) {
        let codeWriter = new codegen.CodeWriter(this.getIndentString(options))
        let includePart = this.getIncludePart(elem);
        codeWriter.writeLine(this.fillCopyrightFileName(elem.name.replace(/\s\*/, '') + '.' + _CPP_CODE_GEN_H));
        codeWriter.writeLine();

        if (includePart.length > 0) {
            codeWriter.writeLine(includePart);
            codeWriter.writeLine();
        }

        codeWriter.writeLine();

        // if file name contain View, add UIKit
        if (elem.name.indexOf('View') != -1) {
            codeWriter.writeLine("#import <Foundation/Foundation.h>");
            codeWriter.writeLine("#import <UIKit/UIKit.h>\n");
        }
        else {
            codeWriter.writeLine("#import <Foundation/Foundation.h>\n");
        }

        funct(codeWriter, elem, this);

        return codeWriter.getData();
    }

    /**
     * Write *.m file. Implement functor to each uml type.
     * Returns text
     *
     * @param {Object} elem
     * @param {Object} options
     * @param {Object} functor
     * @return {Object} string
     */
    writeBodySkeletonCode (elem, options, funct) {
        var codeWriter = new codegen.CodeWriter(this.getIndentString(options))
        codeWriter.writeLine(this.fillCopyrightFileName(elem.name.replace(/\s\*/, '')  + '.' + _CPP_CODE_GEN_CPP));
        codeWriter.writeLine();
        codeWriter.writeLine("#import \"" +  elem.name.replace(/\s\*/, '') + ".h\"");
        codeWriter.writeLine();
        funct(codeWriter, elem, this);
        return codeWriter.getData();
    }

    /**
     * Parsing template parameter
     *
     * @param {Object} elem
     * @return {Object} string
     */
    getTemplateParameter (elem) {
        var i;
        var returnTemplateString = "";
        if (elem.templateParameters.length <= 0) {
            return returnTemplateString;
        }
        var term = [];
        returnTemplateString = "template<";

        for (i = 0; i < elem.templateParameters.length; i++) {
            var template = elem.templateParameters[i];
            var templateStr = template.parameterType + " ";
            templateStr += template.name + " ";
            if (template.defaultValue.length !== 0) {
                templateStr += " = " + template.defaultValue;
            }
            term.push(templateStr);
        }
        returnTemplateString += term.join(", ");
        returnTemplateString += ">";
        return returnTemplateString;
    }

    /**
     * Parsing include header
     *
     * @param {Object} elem
     * @return {Object} string
     */
    getIncludePart (elem) {
        var i;
        var trackingHeader = function (elem, target) {
            var header = "";
            var elementString = "";
            var targetString = "";
            var i;


            while (elem._parent._parent !== null) {
                elementString = (elementString.length !== 0) ?  elem.name + "/" + elementString : elem.name;
                elem = elem._parent;
            }
            while (target._parent._parent !== null) {
                targetString = (targetString.length !== 0) ?  target.name + "/" + targetString : target.name;
                target = target._parent;
            }

            var idx;
            for (i = 0; i < (elementString.length < targetString.length) ? elementString.length : targetString.length; i++) {

                if (elementString[i] === targetString[i]) {
                    if (elementString[i] === '/' && targetString[i] === '/') {
                        idx = i + 1;
                    }
                } else {
                    break;
                }
            }
            // remove common path
            elementString = elementString.substring(idx, elementString.length);
            targetString = targetString.substring(idx, targetString.length);

            for (i = 0; i < elementString.split('/').length - 1; i++) {
                header += "../";
            }
            header += targetString;

            // objc use last part
            let parts = header.split('/');
            let lastPart = parts[parts.length - 1]

            return lastPart;
        };


        var headerString = "";
        if (app.repository.getRelationshipsOf(elem).length <= 0) {
            return "";
        }
        var associations = app.repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });
        var realizations = app.repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLInterfaceRealization || rel instanceof type.UMLGeneralization);
        });

        // check for interface or class
        for (i = 0; i < realizations.length; i++) {
            var realize = realizations[i];
            if (realize.target === elem) {
                continue;
            }

            if (trackingHeader(elem, realize.target).substr(0,2) === "UI") {
                continue;
            }

            if (trackingHeader(elem, realize.target).substr(0,2) === "NS") {
                continue;
            }

            if (trackingHeader(elem, realize.target).substr(0,2) === "AB") {
                continue;
            }

            headerString += "#import \"" + trackingHeader(elem, realize.target).replace(/\s\*/,'') + ".h\"\n";
        }

        // check for member variable
        for (i = 0; i < associations.length; i++) {
            var asso = associations[i];
            var target;
            if (asso.end1.reference === elem && asso.end2.navigable === true && asso.end2.name.length !== 0) {
                target = asso.end2.reference;
            } else if (asso.end2.reference === elem && asso.end1.navigable === true && asso.end1.name.length !== 0) {
                target = asso.end1.reference;
            } else {
                continue;
            }
            if (target === elem) {
                continue;
            }

            if (trackingHeader(elem, target).substr(0,2) === "UI") {
                continue;
            }

            if (trackingHeader(elem, target).substr(0,2) === "NS") {
                continue;
            }

            if (trackingHeader(elem, target).substr(0,2) === "AB") {
                continue;
            }

            headerString += "#import \"" + trackingHeader(elem, target).replace(/\s\*/,'') + ".h\"\n";
        }

        return headerString;
    }

    /**
     * Classfy method and attribute by accessor.(public, private, protected)
     *
     * @param {Object} items
     * @return {Object} list
     */
    classifyVisibility (items) {
        var public_list = [];
        var protected_list = [];
        var private_list = [];
        var i;
        for (i = 0; i < items.length; i++) {

            var item = items[i];
            var visib = this.getVisibility(item);

            if ("public" === visib) {
                public_list.push(item);
            } else if ("private" === visib) {
                private_list.push(item);
            } else {
                // if modifier not setted, consider it as protected
                protected_list.push(item);
            }
        }
        return {
            _public : public_list,
            _protected: protected_list,
            _private: private_list
        };
    }

    /**
     * generate variables from attributes[i]
     *
     * @param {Object} elem
     * @return {Object} string
     */
    getMemberVariable (elem) {
        if (elem.name.length > 0) {
            let terms = [];
            // doc
            let doc = '';

            if (elem.documentation.length > 0) {
                doc = '\t///< ' + elem.documentation.replace(/\n/g, '; ');
            }

            let property = "@property (nonatomic, ";
            // type
            let _type = this.getType(elem);

            if (_type.indexOf('*') === -1) {
                property += "assign) ";
            }
            else if (_type.indexOf('NSString') != -1 || _type.indexOf('^') != -1) {
                // NSString & block need 'copy' keyword
                property += "copy) ";
            }
            else {
                property += "strong) ";
            }

            if (elem.type instanceof type.UMLInterface && elem.multiplicity.length == 0) {
                _type = "id<" + _type + ">";
            }

            let space = " "
            if (_type.charAt(_type.length - 1) == "*") {
                // If last char is '*'
                space = ""  // remove space before param name
            }
            property += _type + space + elem.name + ";";

            return property + doc;
        }
    }

    /**
     * generate methods from operations[i]
     *
     * @param {Object} elem
     * @param {boolean} isCppBody
     * @return {Object} string
     */
    getMethod (elem, isCppBody) {
        if (elem.name.length > 0) {
            var docs = elem.documentation ? elem.documentation : elem.name;
            var i;
            var methodStr = "- ";
            var isVirtaul = false;
            // TODO virtual fianl static 키워드는 섞어 쓸수가 없다
            if (elem.isStatic === true) {
                methodStr = "+ ";
            }

            var returnTypeParam = elem.parameters.filter(function (params) {
                return params.direction === 'return'
            })
            var inputParams = elem.parameters.filter(function (params) {
                return params.direction === 'in'
            })
            var inputParamStrings = [];
            for (i = 0; i < inputParams.length; i++) {
                var inputParam = inputParams[i];
                inputParamStrings.push(this.getType(inputParam) ? this.getType(inputParam) : '');
                inputParamStrings.push(inputParam.name ? inputParam.name : '');
                inputParamStrings.push(inputParam.stereotype ? inputParam.stereotype : '');
                docs += "\n@param " + inputParam.name + ' ' + ((inputParam.documentation) ? inputParam.documentation : '');
            }
            if (returnTypeParam.length > 0) {
                var tmpReturnType = this.getType(returnTypeParam[0]);
                docs += "\n@return " + (returnTypeParam[0].documentation ? returnTypeParam[0].documentation : tmpReturnType);
                methodStr += "(" + this.getType(returnTypeParam[0]) + ")";
            } else {
                methodStr += "(void)";
            }

            var splitParamsFunc = function (params) {
                var firstUpperCase = function (str) {
                    return str.replace(/\b(\w)(\w*)/g, function ($0, $1, $2) {
                        return $1.toUpperCase() + $2;
                    });
                };
                var str = "";
                for (i = 0; i < params.length; i = i + 3) {
                    var ptype = params[i];
                    var pvalue = params[i + 1];
                    var pstereotype = params[i + 2];
                    var keywordSignatures = ':' + '(' + ptype + ')' + pvalue + ' ';
                    if (i === 0) {
                        str += keywordSignatures;
                        continue;
                    }

                    str += (pstereotype && pstereotype.length > 0) ? pstereotype + keywordSignatures : pvalue + keywordSignatures;
                }

                return str.replace(/(^\s*)|(\s*$)/g, '');
            };

            if (isCppBody) {
                var t_elem = elem;
                var specifier = "";

                while (t_elem._parent instanceof type.UMLClass) {
                    specifier = specifier;
                    t_elem = t_elem._parent;
                }

                var indentLine = "";

                for (i = 0; i < this.genOptions.indentSpaces; i++) {
                    indentLine += " ";
                }

                methodStr += specifier;
                methodStr += elem.name;
                methodStr += splitParamsFunc(inputParamStrings) + " {\n";
                if (elem.isAbstract === true && this.genOptions.genStrictAbstract) {
                    methodStr += '\n' + indentLine + "AbstractMethodNotImplemented();";
                }
                if (returnTypeParam.length > 0) {
                    var returnType = this.getType(returnTypeParam[0]);
                    if (returnType === "boolean" || returnType === "bool" || returnType === "BOOL") {
                        methodStr += '\n' + indentLine + "return NO;";
                    } else if (returnType === "int" || returnType === "long" || returnType === "short" || returnType === "byte" || returnType === "NSInteger") {
                        methodStr += '\n' + indentLine + "return 0;";
                    } else if (returnType === "double" || returnType === "float" || returnType === "CGFloat") {
                        methodStr += '\n' + indentLine + "return 0.0;";
                    } else if (returnType === "char") {
                        methodStr += '\n' + indentLine + "return '0';";
                    } else if (returnType === "string" || returnType === "String" || returnType === "NSString *") {
                        methodStr += '\n' + indentLine + 'return @"";';
                    } else if (returnType === "void") {
                        methodStr += '\n' + indentLine + "return;";
                    } else {
                        methodStr += '\n' + indentLine + "return nil;";
                    }
                }
                methodStr += "\n}";
            } else {
                methodStr += elem.name;
                methodStr += "";

                methodStr += splitParamsFunc(inputParamStrings);

                methodStr += ";";
            }

            if (elem.documentation.length == 0) {
                // no comment
                return "\n" + methodStr;
            }
            else {
                return "\n" + this.getDocuments(docs) + '\n' + methodStr;
            }
        }
    }

    /**
     * generate doc string from doc element
     *
     * @param {Object} text
     * @return {Object} string
     */
    getDocuments (text) {
        var docs = ''
        if ((typeof text === 'string') && text.length !== 0) {
            var lines = text.trim().split("\n");
            docs += "/**\n";
            var i;
            for (i = 0; i < lines.length; i++) {
                docs += " * " + lines[i] + "\n";
            }
            docs += " */";
        }
        return docs;
    }

    /**
     * parsing visibility from element
     *
     * @param {Object} elem
     * @return {Object} string
     */
    getVisibility (elem) {
        switch (elem.visibility) {
            case type.UMLModelElement.VK_PUBLIC:
                return 'public'
            case type.UMLModelElement.VK_PROTECTED:
                return 'protected'
            case type.UMLModelElement.VK_PRIVATE:
                return 'private'
        }
        return null
    }

    /**
     * parsing modifiers from element
     *
     * @param {Object} elem
     * @return {Object} list
     */
    getModifiers (elem) {
        var modifiers = [];

        if (elem.isStatic === true) {
            modifiers.push("static");
        }
        if (elem.isReadOnly === true) {
            modifiers.push("const");
        }
        if (elem.isAbstract === true) {
            modifiers.push("virtual");
        }
        return modifiers;
    }

    /**
     * parsing type from element
     *
     * @param {Object} elem
     * @return {Object} string
     */
    getType (elem) {
        var _type = "id";

        // If has prefix

        if (elem instanceof type.UMLAssociationEnd) { // member variable from association
            if (elem.reference instanceof type.UMLModelElement && elem.reference.name.length > 0) {
                _type = elem.reference.name;
            }
        } else { // member variable inside class
            if (elem.type instanceof type.UMLModelElement && elem.type.name.length > 0) {
                _type = elem.type.name;
            } else if ((typeof elem.type === 'string') && elem.type.length > 0) {
                _type = elem.type;
            }
        }

        // multiplicity
        if (elem.multiplicity) {
            _type = "NSArray<" + _type + "> *"
        }
        return this.renameType(_type);
    }

    /**
     * get all super class / interface from element
     *
     * @param {Object} elem
     * @return {Object} list
     */
    getSuperClasses (elem) {
        var generalizations = app.repository.getRelationshipsOf(elem, function (rel) {
            return ((rel instanceof type.UMLGeneralization || rel instanceof type.UMLInterfaceRealization) && rel.source === elem);
        });
        return generalizations;
    }

    renameType (type) {
        switch (type) {
            case "String":
                return "NSString *";
            case "string":
                return "NSString *";
            case "Integer":
                return "NSInteger";
            case "boolean":
                return "BOOL";
            case "float":
                return "CGFloat";
            case "int":
                return "NSInteger";
            case "byte":
                return "Byte";
            case "Object":
                return "id";
        }
        return type;
    }

    fillCopyrightFileName (fileName) {
        return copyrightHeader.replace(/%FILENAME%/g, fileName)
    }
}

var deleteFolderRecursive = function(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

function generate(baseModel, basePath, options) {
    var cppCodeGenerator = new CppCodeGenerator(baseModel, basePath)
    cppCodeGenerator.generate(baseModel, basePath, options)
}

function getVersion() {return versionString; }

exports.generate = generate;
exports.getVersion = getVersion;