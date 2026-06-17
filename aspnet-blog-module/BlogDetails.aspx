<%@ Page Title="" Language="C#" MasterPageFile="~/User.master" AutoEventWireup="true"
    CodeFile="BlogDetails.aspx.cs" Inherits="BlogDetails" %>

<asp:Content ID="cTitle" ContentPlaceHolderID="TitleContent" runat="server"><asp:Literal ID="litTitleTag" runat="server" Text="مقاله" /></asp:Content>

<asp:Content ID="cMain" ContentPlaceHolderID="MainContent" runat="server">

    <style>
        .article-layout { display:grid; grid-template-columns: 1fr 320px; gap: 30px; align-items:start; }
        @media (max-width: 991px){ .article-layout { grid-template-columns: 1fr; } }
        .article-main { background: var(--light-card); border-radius: var(--border-radius); overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,.06); }
        body.dark-mode .article-main { background: var(--dark-card); }
        .article-hero { width:100%; max-height:420px; object-fit:cover; }
        .article-inner { padding: 30px 34px; }
        @media (max-width: 600px){ .article-inner { padding: 22px 20px; } }
        .breadcrumb-bar { font-size:13px; color:#999; margin-bottom:16px; }
        .breadcrumb-bar a { color: var(--primary-color); text-decoration:none; }
        .article-title { font-size:28px; font-weight:800; line-height:1.7; margin-bottom:16px; }
        .article-metabar { display:flex; flex-wrap:wrap; gap:18px; font-size:13px; color:#888; border-bottom:1px solid rgba(0,0,0,.07); padding-bottom:18px; margin-bottom:22px; }
        body.dark-mode .article-metabar { border-bottom-color: rgba(255,255,255,.08); }
        .article-metabar i { color: var(--primary-color); margin-left:5px; }
        .article-content { font-size:15px; line-height:2.2; }
        .article-content h1,.article-content h2,.article-content h3,.article-content h4 { margin:22px 0 12px; font-weight:700; line-height:1.6; }
        .article-content p { margin-bottom:16px; }
        .article-content img { max-width:100%; height:auto; border-radius:10px; margin:14px 0; }
        .article-content table { border-collapse:collapse; width:100%; margin:16px 0; }
        .article-content table td, .article-content table th { border:1px solid #ddd; padding:8px; }
        .article-content blockquote { border-right:4px solid var(--primary-color); background:rgba(102,126,234,.06); margin:16px 0; padding:10px 18px; border-radius:8px; }
        .article-content pre { background:#1e1e2e; color:#e2e8f0; padding:16px; border-radius:10px; overflow:auto; direction:ltr; text-align:left; }
        .article-content iframe { max-width:100%; border-radius:10px; }
        .toc-card { background:rgba(102,126,234,.06); border:1px solid rgba(102,126,234,.18); border-radius:12px; padding:16px 20px; margin-bottom:24px; }
        .toc-card b { display:block; margin-bottom:8px; color:var(--primary-color); }
        .article-tags { margin-top:26px; display:flex; flex-wrap:wrap; gap:8px; }
        .article-tags a { background: rgba(102,126,234,.1); color: var(--primary-color); font-size:12px; padding:5px 14px; border-radius:20px; text-decoration:none; }
        .section-title { font-size:18px; font-weight:700; margin:30px 0 14px; padding-right:12px; border-right:4px solid var(--primary-color); }
        .gallery-grid { display:grid; grid-template-columns: repeat(4,1fr); gap:10px; }
        @media (max-width: 600px){ .gallery-grid { grid-template-columns: repeat(2,1fr); } }
        .gallery-grid a { display:block; border-radius:10px; overflow:hidden; height:110px; }
        .gallery-grid img { width:100%; height:100%; object-fit:cover; transition:transform .3s ease; }
        .gallery-grid a:hover img { transform:scale(1.08); }
        .video-list { display:grid; grid-template-columns: repeat(2,1fr); gap:16px; }
        @media (max-width: 600px){ .video-list { grid-template-columns: 1fr; } }
        .video-box iframe, .video-box video { width:100%; aspect-ratio:16/9; border:none; border-radius:10px; background:#000; }
        .video-box h4 { font-size:14px; margin-top:8px; }
        .file-list { list-style:none; padding:0; margin:0; }
        .file-list li { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border:1px solid rgba(0,0,0,.08); border-radius:10px; margin-bottom:10px; }
        body.dark-mode .file-list li { border-color: rgba(255,255,255,.1); }
        .file-list .f-name { display:flex; align-items:center; gap:10px; font-size:14px; }
        .file-list .f-name i { color: var(--primary-color); font-size:18px; }
        .file-list a.dl { background: var(--primary-color); color:#fff; padding:7px 16px; border-radius:8px; text-decoration:none; font-size:13px; }
        /* سایدبار */
        .side-card { background: var(--light-card); border-radius: var(--border-radius); box-shadow:0 4px 18px rgba(0,0,0,.06); padding:20px; margin-bottom:24px; }
        body.dark-mode .side-card { background: var(--dark-card); }
        .side-card h3 { font-size:16px; font-weight:700; margin-bottom:16px; padding-bottom:10px; border-bottom:2px solid var(--primary-color); }
        .recent-item { display:flex; gap:12px; margin-bottom:14px; text-decoration:none; }
        .recent-item img { width:64px; height:54px; object-fit:cover; border-radius:8px; flex-shrink:0; }
        .recent-item .r-title { font-size:13px; font-weight:600; color: var(--light-text); line-height:1.7; }
        body.dark-mode .recent-item .r-title { color: var(--dark-text); }
        .recent-item:hover .r-title { color: var(--primary-color); }
        .recent-item .r-date { font-size:11px; color:#999; margin-top:3px; }
        .notfound { text-align:center; padding:70px 20px; }
        .notfound i { font-size:54px; color: var(--primary-color); margin-bottom:16px; }
    </style>

    <%-- استایل اختصاصی مقاله (ArticleStyle) --%>
    <asp:Literal ID="litArticleStyle" runat="server" />

    <%-- حالت یافت‌نشدن --%>
    <asp:Panel ID="pnlNotFound" runat="server" Visible="false">
        <div class="notfound">
            <div><i class="fas fa-triangle-exclamation"></i></div>
            <h2>مقاله یافت نشد</h2>
            <p>این مقاله وجود ندارد یا هنوز منتشر نشده است.</p>
            <p style="margin-top:18px"><a href="Blog.aspx" style="background:var(--primary-color);color:#fff;padding:10px 22px;border-radius:10px;text-decoration:none">بازگشت به وبلاگ</a></p>
        </div>
    </asp:Panel>

    <asp:Panel ID="pnlArticle" runat="server" Visible="false">
        <div class="article-layout">

            <%-- ستون اصلی --%>
            <article class="article-main">
                <asp:Image ID="imgHero" runat="server" CssClass="article-hero" Visible="false" />
                <div class="article-inner">
                    <div class="breadcrumb-bar">
                        <a href="Default.aspx">خانه</a> / <a href="Blog.aspx">وبلاگ</a> / <asp:Literal ID="litCrumb" runat="server" />
                    </div>

                    <h1 class="article-title"><asp:Literal ID="litTitle" runat="server" /></h1>

                    <div class="article-metabar">
                        <span><i class="fas fa-user"></i><asp:Literal ID="litAuthor" runat="server" /></span>
                        <span><i class="fas fa-calendar"></i><asp:Literal ID="litDate" runat="server" /></span>
                        <span><i class="fas fa-eye"></i><asp:Literal ID="litViews" runat="server" /> بازدید</span>
                        <span><i class="fas fa-clock"></i><asp:Literal ID="litReadTime" runat="server" /> دقیقه مطالعه</span>
                    </div>

                    <%-- فهرست مطالب (در صورت وجود سرفصل) --%>
                    <asp:Literal ID="litToc" runat="server" />

                    <%-- متن مقاله --%>
                    <div class="article-content"><asp:Literal ID="litContent" runat="server" /></div>

                    <%-- برچسب‌ها --%>
                    <asp:Literal ID="litTags" runat="server" />

                    <%-- گالری تصاویر --%>
                    <asp:Panel ID="pnlGallery" runat="server" Visible="false">
                        <div class="section-title">گالری تصاویر</div>
                        <div class="gallery-grid">
                            <asp:Repeater ID="rptImages" runat="server">
                                <ItemTemplate>
                                    <a href='<%# ResolveImg(Eval("ImageUrl")) %>' target="_blank" title='<%# Server.HtmlEncode(Convert.ToString(Eval("Caption"))) %>'>
                                        <img src='<%# ResolveImg(Eval("ImageUrl")) %>' alt='<%# Server.HtmlEncode(Convert.ToString(Eval("AltText"))) %>' />
                                    </a>
                                </ItemTemplate>
                            </asp:Repeater>
                        </div>
                    </asp:Panel>

                    <%-- ویدیوها --%>
                    <asp:Panel ID="pnlVideos" runat="server" Visible="false">
                        <div class="section-title">ویدیوها</div>
                        <div class="video-list">
                            <asp:Repeater ID="rptVideos" runat="server">
                                <ItemTemplate>
                                    <div class="video-box">
                                        <%# RenderVideo(Eval("VideoUrl")) %>
                                        <h4><%# Server.HtmlEncode(Convert.ToString(Eval("Title"))) %></h4>
                                    </div>
                                </ItemTemplate>
                            </asp:Repeater>
                        </div>
                    </asp:Panel>

                    <%-- فایل‌های ضمیمه --%>
                    <asp:Panel ID="pnlFiles" runat="server" Visible="false">
                        <div class="section-title">فایل‌های ضمیمه</div>
                        <ul class="file-list">
                            <asp:Repeater ID="rptFiles" runat="server">
                                <ItemTemplate>
                                    <li>
                                        <span class="f-name"><i class="fas fa-file"></i><%# Server.HtmlEncode(Convert.ToString(Eval("FileName"))) %>
                                            <small style="color:#999"><%# FormatSize(Eval("FileSize")) %></small></span>
                                        <a class="dl" href='<%# ResolveImg(Eval("FileUrl")) %>' target="_blank" download><i class="fas fa-download"></i> دانلود</a>
                                    </li>
                                </ItemTemplate>
                            </asp:Repeater>
                        </ul>
                    </asp:Panel>
                </div>
            </article>

            <%-- سایدبار --%>
            <aside>
                <div class="side-card">
                    <h3><i class="fas fa-fire"></i> جدیدترین مقالات</h3>
                    <asp:Repeater ID="rptRecent" runat="server">
                        <ItemTemplate>
                            <a class="recent-item" href='<%# DetailUrl(Eval("Slug")) %>'>
                                <img src='<%# GetThumb(Eval("ThumbnailImage")) %>' alt="" />
                                <div>
                                    <div class="r-title"><%# Server.HtmlEncode(Convert.ToString(Eval("Title"))) %></div>
                                    <div class="r-date"><i class="fas fa-calendar"></i> <%# FormatDate(Eval("PublishedDate"), Eval("CreatedDate")) %></div>
                                </div>
                            </a>
                        </ItemTemplate>
                    </asp:Repeater>
                </div>
                <div class="side-card">
                    <h3><i class="fas fa-store"></i> فروشگاه</h3>
                    <p style="font-size:13px;color:#888;line-height:2">برای دیدن محصولات به <a href="Shop.aspx" style="color:var(--primary-color)">فروشگاه</a> سر بزنید.</p>
                </div>
            </aside>
        </div>
    </asp:Panel>

</asp:Content>
