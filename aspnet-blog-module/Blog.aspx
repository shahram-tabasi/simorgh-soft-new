<%@ Page Title="وبلاگ" Language="C#" MasterPageFile="~/User.master" AutoEventWireup="true"
    CodeFile="Blog.aspx.cs" Inherits="Blog" %>

<asp:Content ID="cTitle" ContentPlaceHolderID="TitleContent" runat="server">وبلاگ</asp:Content>

<asp:Content ID="cMain" ContentPlaceHolderID="MainContent" runat="server">

    <style>
        .blog-hero { background: linear-gradient(135deg,#667eea,#764ba2); color:#fff; border-radius: var(--border-radius); padding: 40px 30px; text-align:center; margin-bottom: 30px; }
        .blog-hero h1 { font-size: 32px; margin-bottom: 10px; color:#fff; }
        .blog-hero p { opacity:.9; font-size:15px; }
        .blog-search { display:flex; gap:10px; max-width:520px; margin: 22px auto 0; }
        .blog-search input { flex:1; padding:12px 16px; border:none; border-radius:30px; font-size:14px; font-family:inherit; }
        .blog-search button { background:#1a1a2e; color:#fff; border:none; padding:0 24px; border-radius:30px; cursor:pointer; font-weight:600; }
        .posts-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 26px; }
        @media (max-width: 991px){ .posts-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 600px){ .posts-grid { grid-template-columns: 1fr; } }
        .post-card { background: var(--light-card); border-radius: var(--border-radius); overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,.06); transition: transform .25s ease, box-shadow .25s ease; display:flex; flex-direction:column; }
        body.dark-mode .post-card { background: var(--dark-card); }
        .post-card:hover { transform: translateY(-6px); box-shadow:0 12px 28px rgba(0,0,0,.12); }
        .post-thumb { display:block; height:190px; overflow:hidden; position:relative; }
        .post-thumb img { width:100%; height:100%; object-fit:cover; transition: transform .4s ease; }
        .post-card:hover .post-thumb img { transform: scale(1.06); }
        .post-feat { position:absolute; top:12px; right:12px; background:#ffc107; color:#1a1a2e; font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; }
        .post-body { padding: 18px 20px; display:flex; flex-direction:column; flex:1; }
        .post-title { font-size:17px; font-weight:700; margin-bottom:10px; line-height:1.6; }
        .post-title a { color: var(--light-text); text-decoration:none; }
        body.dark-mode .post-title a { color: var(--dark-text); }
        .post-title a:hover { color: var(--primary-color); }
        .post-summary { font-size:13px; color:#777; line-height:2; flex:1; margin-bottom:14px; }
        body.dark-mode .post-summary { color:#a0aec0; }
        .post-meta { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#999; border-top:1px solid rgba(0,0,0,.06); padding-top:12px; }
        body.dark-mode .post-meta { border-top-color: rgba(255,255,255,.08); }
        .post-meta i { color: var(--primary-color); margin-left:4px; }
        .post-tags { margin-bottom:12px; display:flex; flex-wrap:wrap; gap:6px; }
        .post-tags a { background: rgba(102,126,234,.1); color: var(--primary-color); font-size:11px; padding:3px 10px; border-radius:20px; text-decoration:none; }
        .blog-pager { display:flex; justify-content:center; gap:6px; margin-top:36px; flex-wrap:wrap; }
        .blog-pager a, .blog-pager span { min-width:40px; text-align:center; padding:9px 12px; border-radius:10px; text-decoration:none; font-size:14px; background: var(--light-card); color: var(--light-text); box-shadow:0 2px 8px rgba(0,0,0,.05); }
        body.dark-mode .blog-pager a, body.dark-mode .blog-pager span { background: var(--dark-card); color: var(--dark-text); }
        .blog-pager .current { background: var(--primary-color); color:#fff; }
        .blog-empty { text-align:center; padding:60px 20px; color:#999; }
        .blog-empty i { font-size:46px; color: var(--primary-color); margin-bottom:14px; }
    </style>

    <div class="blog-hero">
        <h1><i class="fas fa-newspaper"></i> وبلاگ</h1>
        <p>جدیدترین مقالات، آموزش‌ها و اخبار فروشگاه</p>
        <div class="blog-search">
            <asp:TextBox ID="txtSearch" runat="server" placeholder="جستجو در مقالات..." />
            <asp:Button ID="btnSearch" runat="server" Text="جستجو" OnClick="btnSearch_Click" />
        </div>
    </div>

    <asp:Literal ID="litActiveFilter" runat="server" />

    <asp:Panel ID="pnlPosts" runat="server">
        <div class="posts-grid">
            <asp:Repeater ID="rptPosts" runat="server">
                <ItemTemplate>
                    <div class="post-card">
                        <a class="post-thumb" href='<%# DetailUrl(Eval("Slug")) %>'>
                            <img src='<%# GetThumb(Eval("ThumbnailImage")) %>' alt='<%# Server.HtmlEncode(Convert.ToString(Eval("Title"))) %>' />
                            <%# Convert.ToBoolean(Eval("IsFeatured")) ? "<span class='post-feat'>ویژه</span>" : "" %>
                        </a>
                        <div class="post-body">
                            <div class="post-tags"><%# RenderTags(Eval("Tags")) %></div>
                            <h3 class="post-title"><a href='<%# DetailUrl(Eval("Slug")) %>'><%# Server.HtmlEncode(Convert.ToString(Eval("Title"))) %></a></h3>
                            <div class="post-summary"><%# Server.HtmlEncode(Summarize(Eval("Summary"), 130)) %></div>
                            <div class="post-meta">
                                <span><i class="fas fa-user"></i><%# Server.HtmlEncode(Convert.ToString(Eval("Author"))) %></span>
                                <span><i class="fas fa-eye"></i><%# Eval("ViewCount") %></span>
                                <span><i class="fas fa-calendar"></i><%# FormatDate(Eval("PublishedDate"), Eval("CreatedDate")) %></span>
                            </div>
                        </div>
                    </div>
                </ItemTemplate>
            </asp:Repeater>
        </div>

        <div class="blog-pager"><asp:Literal ID="litPager" runat="server" /></div>
    </asp:Panel>

    <asp:Panel ID="pnlEmpty" runat="server" Visible="false">
        <div class="blog-empty">
            <div><i class="fas fa-folder-open"></i></div>
            <h3>مقاله‌ای یافت نشد</h3>
            <p>در حال حاضر مقاله‌ای برای نمایش وجود ندارد.</p>
        </div>
    </asp:Panel>

</asp:Content>
