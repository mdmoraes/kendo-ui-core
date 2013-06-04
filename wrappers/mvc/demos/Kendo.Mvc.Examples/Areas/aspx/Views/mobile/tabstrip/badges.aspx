﻿<%@ Page Title="" Language="C#" MasterPageFile="~/Areas/aspx/Views/Shared/Mobile.Master" Inherits="System.Web.Mvc.ViewPage<dynamic>" %>

<asp:Content ID="Content1" ContentPlaceHolderID="MainContent" runat="server">

<% Html.Kendo().MobileView()
        .Name("badges-profile")
        .Layout("mobile-tabstrip")
        .Title("Profile")
        .Events(events => events.Show("addTimer").Hide("removeTimer"))
        .Content(() =>
        {
            %>
            <ul data-role="listview" data-style="inset" data-type="group">
                <li>Profile
                    <ul>
                        <li><h2>Carine <span>Callahan</span></h2><img src="../../content/mobile/overview/carine.jpg" /></li>
                        <li>Weekly average sales <span class="sales-up">$ 8,250</span></li>
                        <li>Monthly average sales <span class="sales-up">$ 32,000</span></li>
                    </ul>
                </li>
                <li>
                    Languages
                    <ul>
                        <li>English <span class="value">Native</span></li>
                        <li>Hungarian <span class="value">Advanced</span></li>
                        <li>French <span class="value">Advanced</span></li>
                        <li>Chinese <span class="value">Beginner</span></li>
                    </ul>
                </li>
                <li>
                    Sales commodity
                    <ul>
                        <li>Beverages</li>
                        <li>Condiments</li>
                        <li>Confections</li>
                        <li>Diary Products</li>
                        <li>Grains/Cereals</li>
                        <li>Meat/Poultry</li>
                        <li>Produce</li>
                        <li>Seafood</li>
                    </ul>
                </li>
                <li>
                    PC Skills
                    <ul>
                        <li>MS Word</li>
                        <li>MS Excel</li>
                        <li>MS Outlook</li>
                        <li>MS PowerPoint</li>
                        <li>MS Project</li>
                        <li>Windows (XP, Vista)</li>
                        <li>Internet</li>
                        <li>SAP - Sales and Marketing Module</li>
                        <li>MS Visual Studio</li>
                        <li>Adobe Acrobat</li>
                        <li>CorelDraw</li>
                    </ul>
                </li>
            </ul>
            <%
        })
        .Render();
%>

<% Html.Kendo().MobileView()
        .Name("badges-sales")
        .Layout("mobile-tabstrip")
        .Title("Sales History")
        .Events(events => events.Show("addTimer").Hide("removeTimer"))
        .Content(() =>
        {
            %>
            <ul data-role="listview" data-style="inset" data-type="group">
                <li>
                    Sales 2011
                    <ul>
                        <li>January <span class="sales-up">&uarr; $ 35,000</span></li>
                        <li>February <span class="sales-down">&darr; $ 25,000</span></li>
                        <li>March <span class="sales-down">&darr; $ 23,000</span></li>
                        <li>April <span class="sales-up">&uarr; $ 30,000</span></li>
                        <li>May <span class="sales-up">&uarr; $ 31,000</span></li>
                        <li>June <span class="sales-down">&darr; $ 29,000</span></li>
                        <li>July <span class="sales-up">&uarr; $ 35,000</span></li>
                        <li>August <span class="sales-up">&uarr; $ 37,000</span></li>
                        <li>September <span class="sales-hold">&rarr; $ 37,000</span></li>
                        <li>October <span class="sales-hold">&rarr; $ 37,000</span></li>
                        <li>November <span class="sales-up">&uarr; $ 38,000</span></li>
                        <li>December <span class="sales-up">&uarr; $ 40,000</span></li>
                    </ul>
                </li>
            </ul>
            <%
        })
        .Render();
%>

<% Html.Kendo().MobileLayout()
    .Name("mobile-tabstrip")
    .Header(() =>
    {
        Html.Kendo().MobileNavBar()                                   
            .Content((navbar) => 
                {                                
                    %>                                
                    <%: navbar.ViewTitle("") %>                                
                    <%: Html.Kendo().MobileButton()
                            .Align(MobileButtonAlign.Right) 
                            .HtmlAttributes(new { @class = "nav-button" })
                            .Href("#index")
                            .Text("Index")
                    %>                                 
                    <%
                })
            .Render();                  
    })
    .Footer(() =>
    {
        %>
        <%: Html.Kendo().MobileTabStrip()
                .Name("badges-tabs")
                .Items(items => 
                {
                    items.Add().Icon("home").Text("Home").Href("#badges-profile");
                    items.Add().Icon("edit").Text("Mail").Href("#badges-sales").Badge("10");                  
                })
        %>
        <%
    })
    .Render();
%>

<script>
    var timer;

    function changeTabBadge() {
        var tabstrip = $("#badges-tabs").data("kendoMobileTabStrip");
        if (!tabstrip) {
            removeTimer();
            return;
        }

        tabstrip.badge("a:last", +tabstrip.badge("a:last") + 5);
    }

    function addTimer() {
        timer = setInterval(changeTabBadge, 1000);
    }

    function removeTimer() {
        clearInterval(timer);
    }
</script>

<style scoped>
    #tabstrip-profile h2 {
        display: inline-block;
        font-size: 1.1em;
        margin: 1.5em 0 0 1em;
    }
    #tabstrip-profile h2 span {
        display: block;
        clear: both;
        font-size: 2em;
        margin: .2em 0 0 0;
    }
    #tabstrip-profile img {
        width: 5em;
        height: 5em;
        float: left;
        margin: 1em;
        -webkit-box-shadow: 0 1px 3px #333;
        box-shadow: 0 1px 3px #333;
        -webkit-border-radius: 8px;
        border-radius: 8px;
    }
    .sales-down,
    .sales-hold,
    .sales-up,
    .value {
        float: right;
    }
    .sales-up { color: green; }
    .sales-down { color: red; }
    .sales-hold { color: blue; }
    .value { color: #bbb; }
</style>

</asp:Content>
