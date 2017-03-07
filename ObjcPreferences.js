/*
 * Copyright (c) 2013-2014 Minkyu Lee. All rights reserved.
 *
 * NOTICE:  All information contained herein is, and remains the
 * property of Minkyu Lee. The intellectual and technical concepts
 * contained herein are proprietary to Minkyu Lee and may be covered
 * by Republic of Korea and Foreign Patents, patents in process,
 * and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Minkyu Lee (niklaus.lee@gmail.com).
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, appshell, staruml */

define(function (require, exports, module) {
    "use strict";

    var AppInit           = app.getModule("utils/AppInit"),
        Core              = app.getModule("core/Core"),
        PreferenceManager = app.getModule("core/PreferenceManager");

    var preferenceId = "objc";

    var objcPreferences = {
        "objc.gen": {
            text: "Objective-C Code Generation",
            type: "Section"
        },
        "objc.gen.javaDoc": {
            text: "JavaDoc",
            description: "Generate JavaDoc comments.",
            type: "Check",
            default: true
        },
        "objc.gen.useTab": {
            text: "Use Tab",
            description: "Use Tab for indentation instead of spaces.",
            type: "Check",
            default: false
        },
        "objc.gen.indentSpaces": {
            text: "Indent Spaces",
            description: "Number of spaces for indentation.",
            type: "Number",
            default: 4
        },
        "Cpp.gen.includeHeader": {
            text: "Include default header",
            description: "Include default header.",
            type: "Check",
            default: true
        },
        "Cpp.gen.useVector": {
            text: "Use vector instead of *",
            description: "Use vector<> instead of pointer.",
            type: "Check",
            default: true
        },
        "Cpp.gen.genImpl": {
            text: "Generate *.m file",
            description: "Generate implementation file",
            type: "Check",
            default: true
        },
        "Cpp.gen.genStrictAbstract": {
            text: "Generate strict Abstract",
            description: "Generate  strict Abstract",
            type: "Check",
            default: false
        },
        "objc.rev": {
            text: "Objective-C Reverse Engineering",
            type: "Section"
        },
        "objc.rev.association": {
            text: "Use Association",
            description: "Reverse Objective-C Fields as UML Associations.",
            type: "Check",
            default: true
        },
        "objc.rev.publicOnly": {
            text: "Public Only",
            description: "Reverse public members only.",
            type: "Check",
            default: false
        },
        "objc.rev.typeHierarchy": {
            text: "Type Hierarchy Diagram",
            description: "Create a type hierarchy diagram for all classes and interfaces",
            type: "Check",
            default: true
        },
        "objc.rev.packageOverview": {
            text: "Package Overview Diagram",
            description: "Create overview diagram for each package",
            type: "Check",
            default: true
        },
        "objc.rev.packageStructure": {
            text: "Package Structure Diagram",
            description: "Create a package structure diagram for all packages",
            type: "Check",
            default: true
        }
    };

    function getId() {
        return preferenceId;
    }

    function getGenOptions() {
        return {
            javaDoc       : PreferenceManager.get("objc.gen.javaDoc"),
            useTab        : PreferenceManager.get("objc.gen.useTab"),
            indentSpaces  : PreferenceManager.get("objc.gen.indentSpaces"),
            useVector     : PreferenceManager.get("Cpp.gen.useVector"),
            includeHeader : PreferenceManager.get("Cpp.gen.includeHeader"),
            genImpl       : PreferenceManager.get("Cpp.gen.genImpl"),
            genStrictAbstract   : PreferenceManager.get("Cpp.gen.genStrictAbstract")
        };
    }

    function getRevOptions() {
        return {
            association      : PreferenceManager.get("objc.rev.association"),
            publicOnly       : PreferenceManager.get("objc.rev.publicOnly"),
            typeHierarchy    : PreferenceManager.get("objc.rev.typeHierarchy"),
            packageOverview  : PreferenceManager.get("objc.rev.packageOverview"),
            packageStructure : PreferenceManager.get("objc.rev.packageStructure")
        };
    }

    AppInit.htmlReady(function () {
        PreferenceManager.register(preferenceId, "Objective-C", objcPreferences);
    });

    exports.getId         = getId;
    exports.getGenOptions = getGenOptions;
    exports.getRevOptions = getRevOptions;

});
