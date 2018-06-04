// ==UserScript==
// @name         Github Issues: Personal Filters
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Alexander Trousevich <me@trousev.pro>
// @match        https://github.com/*/issues*
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @grant GM_setValue
// @grant GM_getValue
// ==/UserScript==

(function() {
    'use strict';
    let queries = {};
    async function read() {
        try {
            queries = JSON.parse(await GM_getValue("persistent_filters_queries"));
            // console.log("[PersistentFilters] Successfully read filters", queries);
        }
        catch (e) {
            queries = {};
            console.warn("[PersistentFilters] Unable to parse queries", e);
        }
    }
    async function write() {
        try {
            await GM_setValue("persistent_filters_queries", JSON.stringify(queries));
            //console.log("[PersistentFilters] Successfully stored filters");
        }
        catch (e) {
            queries = {};
            console.warn("[PersistentFilters] Unable to write queries", e);
        }
    }
    async function saveAsCurrentFilter() {
        let name = prompt("Please, enter name of filter");
        if(!name) return ;
        let query = $("form.subnav-search input[name=q]").val();
        queries[name] = query;
        await write();
        reinit(true);
    }
    let idCounter = 1;

    function reinit(forced) {
        if(!forced && $(".persistent-filters-item").length) return ;
        $(".persistent-filters-item").remove();
        let currentHref = $("form.subnav-search input[name=q]").val();
        let deadList = [];
        for(let name in queries) {
            let href = queries[name];
            if(href == currentHref) deadList.push(name);
            addItem(name, () => {
                $("form.subnav-search input[name=q]").val(href);
                $("form.subnav-search").submit();
            });
        }
        if(deadList.length) {
            addItem("Remove "+deadList.join(","), () => {
                deadList.forEach(async (item) => {
                    delete queries[item];
                    await write();
                    reinit(true);
                });
            });
        }
        else {
            addItem("Save current query", saveAsCurrentFilter);
        }
    }

    function addItem(text, query) {
        let body = "";
        if(typeof query === 'string') {
            body = "href=\""+query+"\"";
        }
        let id = "PersistentFiltersUserscript_"+(idCounter++);
        $(".subnav [role=search] .select-menu-list").append("<a id='"+id+"' class='select-menu-item js-navigation-item persistent-filters-item' "+body+">"+text+"</a>")
        if (typeof query === 'function') {
            $("#"+id).click(query);
        }
    }

    async function main() {
        await read();
        reinit();
        setInterval(reinit, 1000);
    }

    main();

})();
