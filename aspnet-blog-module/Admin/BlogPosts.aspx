<%@ Page Title="" Language="C#" MasterPageFile="~/Admin/Admin.master" AutoEventWireup="true"
    CodeFile="BlogPosts.aspx.cs" Inherits="Admin_BlogPosts" %>

<%-- =====================================================================
     عنوان صفحه (داخل تگ title مستر)
     ===================================================================== --%>
<asp:Content ID="cTitle" ContentPlaceHolderID="TitleContent" runat="server">مدیریت مقالات</asp:Content>

<%-- عنوان و توضیح نوار بالای مستر --%>
<asp:Content ID="cPageTitle" ContentPlaceHolderID="PageTitle" runat="server">مدیریت مقالات (وبلاگ)</asp:Content>
<asp:Content ID="cPageDesc" ContentPlaceHolderID="PageDescription" runat="server">ثبت، ویرایش و انتشار مقالات فروشگاه</asp:Content>

<%-- =====================================================================
     محتوای اصلی
     ===================================================================== --%>
<asp:Content ID="cMain" ContentPlaceHolderID="MainContent" runat="server">

    <%-- استایل‌های اختصاصی این صفحه (هماهنگ با متغیرهای CSS مستر و دارک‌مود) --%>
    <style>
        .blog-card { background: var(--card-light); border: 1px solid var(--border-light); border-radius: var(--border-radius); padding: 20px 22px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        body.dark-mode .blog-card { background: var(--card-dark); border-color: var(--border-dark); }
        .blog-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
        .blog-toolbar .filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
        .blog-table { width: 100%; border-collapse: collapse; }
        .blog-table th, .blog-table td { padding: 12px 10px; text-align: right; border-bottom: 1px solid var(--border-light); vertical-align: middle; font-size: 13px; }
        body.dark-mode .blog-table th, body.dark-mode .blog-table td { border-bottom-color: var(--border-dark); }
        .blog-table th { background: rgba(102,126,234,0.08); font-weight: 700; }
        .blog-thumb { width: 56px; height: 42px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-light); }
        .badge-pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .badge-on  { background: rgba(40,167,69,0.15);  color: #28a745; }
        .badge-off { background: rgba(220,53,69,0.15);  color: #dc3545; }
        .badge-feat{ background: rgba(255,193,7,0.18);  color: #d39e00; }
        .icon-btn { width: 34px; height: 34px; border: none; border-radius: 9px; cursor: pointer; margin: 0 2px; transition: all .15s ease; font-size: 14px; }
        .icon-btn:hover { transform: translateY(-2px); }
        .ib-view { background: rgba(23,162,184,.15);  color: #17a2b8; }
        .ib-edit { background: rgba(102,126,234,.15); color: #667eea; }
        .ib-del  { background: rgba(220,53,69,.15);   color: #dc3545; }
        .ib-act  { background: rgba(40,167,69,.15);   color: #28a745; }
        .ib-feat { background: rgba(255,193,7,.18);   color: #d39e00; }
        .frm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .frm-grid .full { grid-column: 1 / -1; }
        @media (max-width: 900px){ .frm-grid { grid-template-columns: 1fr; } }
        .frm-grid label { display:block; font-weight:600; font-size:13px; margin-bottom:6px; }
        .form-control, .blog-input, textarea.blog-input, select.blog-input {
            width:100%; padding:10px 12px; border:1px solid var(--border-light); border-radius:10px;
            background: var(--bg-light); color: var(--text-light); font-size:13px; font-family:inherit;
        }
        body.dark-mode .form-control, body.dark-mode .blog-input { background: var(--bg-dark); border-color: var(--border-dark); color: var(--text-dark); }
        .btn { border:none; border-radius:10px; padding:10px 18px; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s ease; }
        .btn:hover { transform: translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,.12); }
        .btn-primary { background: linear-gradient(135deg,#667eea,#764ba2); color:#fff; }
        .btn-success { background:#28a745; color:#fff; }
        .btn-secondary{ background: rgba(102,126,234,.12); color:#667eea; }
        .btn-danger  { background:#dc3545; color:#fff; }
        .btn-sm { padding:6px 12px; font-size:12px; }
        .dropzone { border:2px dashed #667eea; border-radius:14px; padding:24px; text-align:center; color:#667eea; cursor:pointer; background:rgba(102,126,234,.04); transition:all .2s ease; }
        .dropzone.drag { background:rgba(102,126,234,.15); transform:scale(1.01); }
        .media-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:14px; margin-top:14px; }
        .media-item { border:1px solid var(--border-light); border-radius:12px; padding:10px; background:var(--card-light); }
        body.dark-mode .media-item { border-color:var(--border-dark); background:var(--card-dark); }
        .media-item img { width:100%; height:110px; object-fit:cover; border-radius:8px; }
        .seo-preview { border:1px solid var(--border-light); border-radius:12px; padding:14px 16px; background:#fff; max-width:600px; }
        body.dark-mode .seo-preview { background:#fff; }
        .seo-preview .g-title { color:#1a0dab; font-size:18px; line-height:1.3; }
        .seo-preview .g-url   { color:#006621; font-size:13px; margin:2px 0; direction:ltr; text-align:left; }
        .seo-preview .g-desc  { color:#545454; font-size:13px; }
        .ck-editor__editable { min-height: 320px; }
        .ck-fullscreen { position: fixed !important; inset: 0 !important; z-index: 99999 !important; background: var(--bg-light); padding: 16px; overflow:auto; }
        body.dark-mode .ck-fullscreen { background: var(--bg-dark); }
        .stat-chip { display:inline-block; background:rgba(102,126,234,.1); color:#667eea; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; margin-left:8px; }
        .toc-box { border:1px dashed var(--border-light); border-radius:12px; padding:14px; margin-top:10px; font-size:13px; }
        .pager a, .pager span { display:inline-block; min-width:34px; text-align:center; padding:6px 10px; margin:0 2px; border-radius:8px; border:1px solid var(--border-light); text-decoration:none; color:var(--text-light); font-size:13px; }
        body.dark-mode .pager a, body.dark-mode .pager span { border-color:var(--border-dark); color:var(--text-dark); }
        .pager .current { background:#667eea; color:#fff; border-color:#667eea; }
        .toast-msg { padding:12px 16px; border-radius:10px; margin-bottom:16px; font-size:13px; font-weight:600; }
        .toast-ok { background:rgba(40,167,69,.15); color:#28a745; }
        .toast-err{ background:rgba(220,53,69,.15); color:#dc3545; }
        .hint { font-size:11px; color:#888; margin-top:4px; }
    </style>

    <%-- ScriptManager (مستر آن را ندارد) --%>
    <asp:ScriptManager ID="sm" runat="server" EnablePageMethods="false" />

    <%-- پیام سیستم --%>
    <asp:Literal ID="litMessage" runat="server" />

    <%-- ===================== بخش اول: لیست مقالات ===================== --%>
    <asp:Panel ID="pnlList" runat="server">
        <div class="blog-card">
            <div class="blog-toolbar">
                <div class="filters">
                    <asp:TextBox ID="txtSearch" runat="server" CssClass="blog-input" style="width:220px"
                        placeholder="جستجو در عنوان، خلاصه، برچسب، نویسنده..." />
                    <asp:DropDownList ID="ddlActive" runat="server" CssClass="blog-input" style="width:140px">
                        <asp:ListItem Value="" Text="وضعیت: همه" />
                        <asp:ListItem Value="1" Text="فعال (منتشرشده)" />
                        <asp:ListItem Value="0" Text="غیرفعال (پیش‌نویس)" />
                    </asp:DropDownList>
                    <asp:DropDownList ID="ddlFeatured" runat="server" CssClass="blog-input" style="width:130px">
                        <asp:ListItem Value="" Text="ویژه: همه" />
                        <asp:ListItem Value="1" Text="فقط ویژه" />
                        <asp:ListItem Value="0" Text="عادی" />
                    </asp:DropDownList>
                    <asp:DropDownList ID="ddlSort" runat="server" CssClass="blog-input" style="width:160px">
                        <asp:ListItem Value="CreatedDate|DESC" Text="جدیدترین" />
                        <asp:ListItem Value="CreatedDate|ASC"  Text="قدیمی‌ترین" />
                        <asp:ListItem Value="ViewCount|DESC"   Text="پربازدیدترین" />
                        <asp:ListItem Value="Title|ASC"        Text="عنوان (الف-ی)" />
                        <asp:ListItem Value="Title|DESC"       Text="عنوان (ی-الف)" />
                        <asp:ListItem Value="PublishedDate|DESC" Text="تاریخ انتشار" />
                    </asp:DropDownList>
                    <asp:DropDownList ID="ddlPageSize" runat="server" CssClass="blog-input" style="width:90px" AutoPostBack="true" OnSelectedIndexChanged="ddlPageSize_Changed">
                        <asp:ListItem Value="10" Text="10" />
                        <asp:ListItem Value="20" Text="20" />
                        <asp:ListItem Value="50" Text="50" />
                    </asp:DropDownList>
                    <asp:Button ID="btnSearch" runat="server" Text="جستجو" CssClass="btn btn-primary" OnClick="btnSearch_Click" />
                </div>
                <asp:Button ID="btnNew" runat="server" Text="+ مقاله جدید" CssClass="btn btn-success" OnClick="btnNew_Click" />
            </div>

            <div style="overflow-x:auto; margin-top:18px;">
                <table class="blog-table">
                    <thead>
                        <tr>
                            <th style="width:70px">تصویر</th>
                            <th>عنوان / Slug</th>
                            <th style="width:120px">نویسنده</th>
                            <th style="width:80px">بازدید</th>
                            <th style="width:160px">وضعیت</th>
                            <th style="width:120px">تاریخ ایجاد</th>
                            <th style="width:220px">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <asp:Repeater ID="rptPosts" runat="server" OnItemCommand="rptPosts_ItemCommand">
                            <ItemTemplate>
                                <tr>
                                    <td>
                                        <img class="blog-thumb" src='<%# GetThumb(Eval("ThumbnailImage")) %>' alt="" />
                                    </td>
                                    <td>
                                        <div style="font-weight:700"><%# Server.HtmlEncode(Convert.ToString(Eval("Title"))) %></div>
                                        <div style="font-size:11px;color:#888;direction:ltr;text-align:right"><%# Server.HtmlEncode(Convert.ToString(Eval("Slug"))) %></div>
                                    </td>
                                    <td><%# Server.HtmlEncode(Convert.ToString(Eval("Author"))) %></td>
                                    <td><%# Eval("ViewCount") %></td>
                                    <td>
                                        <%# Convert.ToBoolean(Eval("IsActive"))
                                            ? "<span class='badge-pill badge-on'>فعال</span>"
                                            : "<span class='badge-pill badge-off'>پیش‌نویس</span>" %>
                                        <%# Convert.ToBoolean(Eval("IsFeatured"))
                                            ? "<span class='badge-pill badge-feat'>ویژه</span>" : "" %>
                                    </td>
                                    <td><%# FormatDate(Eval("CreatedDate")) %></td>
                                    <td>
                                        <asp:LinkButton runat="server" CssClass="icon-btn ib-view" ToolTip="مشاهده"
                                            CommandName="ViewPost" CommandArgument='<%# Eval("Id") %>'><i class="fas fa-eye"></i></asp:LinkButton>
                                        <asp:LinkButton runat="server" CssClass="icon-btn ib-edit" ToolTip="ویرایش"
                                            CommandName="EditPost" CommandArgument='<%# Eval("Id") %>'><i class="fas fa-pen"></i></asp:LinkButton>
                                        <asp:LinkButton runat="server" CssClass="icon-btn ib-act" ToolTip="فعال/غیرفعال"
                                            CommandName="ToggleActive" CommandArgument='<%# Eval("Id") %>'><i class="fas fa-power-off"></i></asp:LinkButton>
                                        <asp:LinkButton runat="server" CssClass="icon-btn ib-feat" ToolTip="ویژه/عادی"
                                            CommandName="ToggleFeatured" CommandArgument='<%# Eval("Id") %>'><i class="fas fa-star"></i></asp:LinkButton>
                                        <asp:LinkButton runat="server" CssClass="icon-btn ib-del" ToolTip="حذف"
                                            CommandName="DeletePost" CommandArgument='<%# Eval("Id") %>'
                                            OnClientClick="return confirm('آیا از حذف این مقاله و تمام تصاویر/ویدیوها/فایل‌های آن مطمئن هستید؟');"><i class="fas fa-trash"></i></asp:LinkButton>
                                    </td>
                                </tr>
                            </ItemTemplate>
                        </asp:Repeater>
                    </tbody>
                </table>
            </div>

            <asp:Panel ID="pnlEmpty" runat="server" Visible="false">
                <div style="text-align:center;padding:30px;color:#888">موردی یافت نشد.</div>
            </asp:Panel>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px;flex-wrap:wrap;gap:10px">
                <div style="font-size:12px;color:#888"><asp:Literal ID="litCountInfo" runat="server" /></div>
                <div class="pager"><asp:Literal ID="litPager" runat="server" /></div>
            </div>
        </div>
    </asp:Panel>

    <%-- ===================== بخش دوم: فرم ثبت/ویرایش ===================== --%>
    <asp:Panel ID="pnlForm" runat="server" Visible="false">
        <asp:HiddenField ID="hfPostId" runat="server" Value="0" />

        <div class="blog-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <h3 style="margin:0"><asp:Literal ID="litFormTitle" runat="server" Text="مقاله جدید" /></h3>
                <asp:Button ID="btnBackToList" runat="server" Text="بازگشت به لیست" CssClass="btn btn-secondary btn-sm" OnClick="btnBackToList_Click" />
            </div>

            <div class="frm-grid" style="margin-top:14px">
                <div>
                    <label>عنوان مقاله <span style="color:#dc3545">*</span></label>
                    <asp:TextBox ID="txtTitle" runat="server" CssClass="blog-input" ClientIDMode="Static" onkeyup="autoSlug()" />
                </div>
                <div>
                    <label>Slug (نشانی یکتا)
                        <button type="button" class="btn btn-secondary btn-sm" style="float:left" onclick="genSlug();return false;">تولید از عنوان</button>
                    </label>
                    <asp:TextBox ID="txtSlug" runat="server" CssClass="blog-input" ClientIDMode="Static" onkeyup="updateSeoPreview()" style="direction:ltr;text-align:left" />
                </div>

                <div class="full">
                    <label>خلاصه (Summary)</label>
                    <asp:TextBox ID="txtSummary" runat="server" CssClass="blog-input" TextMode="MultiLine" Rows="2" />
                </div>

                <div class="full">
                    <label>محتوای مقاله (Content)</label>
                    <textarea id="editor"></textarea>
                    <%-- مقدار واقعی که به سرور می‌رود؛ قبل از Postback از CKEditor پر می‌شود --%>
                    <asp:HiddenField ID="hfContent" runat="server" ClientIDMode="Static" />
                    <div style="margin-top:10px">
                        <span class="stat-chip"><i class="fas fa-file-word"></i> کلمات: <b id="wordCount">0</b></span>
                        <span class="stat-chip"><i class="fas fa-clock"></i> زمان مطالعه: <b id="readTime">0</b> دقیقه</span>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="buildTOC();return false;"><i class="fas fa-list-ol"></i> ساخت فهرست مطالب</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="toggleFullscreen();return false;"><i class="fas fa-expand"></i> تمام‌صفحه</button>
                    </div>
                    <div id="tocBox" class="toc-box" style="display:none"></div>
                </div>

                <div>
                    <label>برچسب‌ها (با , جدا کنید)</label>
                    <asp:TextBox ID="txtTags" runat="server" CssClass="blog-input" placeholder="آموزش, فروشگاه, ..." />
                </div>
                <div>
                    <label>نویسنده</label>
                    <asp:TextBox ID="txtAuthor" runat="server" CssClass="blog-input" />
                </div>

                <div>
                    <label>تصویر شاخص (Thumbnail)</label>
                    <asp:FileUpload ID="fuThumbnail" runat="server" CssClass="blog-input" accept="image/*" />
                    <div class="hint">اگر گالری تصویرِ شاخص داشته باشد، خودکار ست می‌شود.</div>
                    <asp:Image ID="imgThumb" runat="server" CssClass="blog-thumb" style="width:120px;height:80px;margin-top:8px" Visible="false" />
                </div>
                <div>
                    <label>استایل اختصاصی مقاله (ArticleStyle - CSS)</label>
                    <asp:TextBox ID="txtArticleStyle" runat="server" CssClass="blog-input" TextMode="MultiLine" Rows="3"
                        placeholder=".article-body h2{color:#667eea}" style="direction:ltr;text-align:left" />
                </div>

                <div style="display:flex;gap:24px;align-items:center">
                    <label style="display:flex;align-items:center;gap:8px;margin:0">
                        <asp:CheckBox ID="chkIsActive" runat="server" /> فعال / منتشرشده
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;margin:0">
                        <asp:CheckBox ID="chkIsFeatured" runat="server" /> مقالهٔ ویژه
                    </label>
                </div>
                <div>
                    <label>تاریخ انتشار (PublishedDate) — اختیاری</label>
                    <asp:TextBox ID="txtPublishedDate" runat="server" CssClass="blog-input" placeholder="1403/03/27 یا 2024-06-17" style="direction:ltr;text-align:left" />
                    <div class="hint">خالی بگذارید تا هنگام انتشار خودکار ثبت شود.</div>
                </div>
            </div>
        </div>

        <%-- ---------- بخش SEO ---------- --%>
        <div class="blog-card">
            <h3 style="margin-top:0"><i class="fas fa-magnifying-glass-chart"></i> تنظیمات سئو (SEO)</h3>
            <div class="frm-grid">
                <div class="full">
                    <label>Meta Title</label>
                    <asp:TextBox ID="txtMetaTitle" runat="server" CssClass="blog-input" ClientIDMode="Static" onkeyup="updateSeoPreview()" />
                </div>
                <div class="full">
                    <label>Meta Description</label>
                    <asp:TextBox ID="txtMetaDescription" runat="server" CssClass="blog-input" TextMode="MultiLine" Rows="2" ClientIDMode="Static" onkeyup="updateSeoPreview()" />
                </div>
                <div class="full">
                    <label>Meta Keywords</label>
                    <asp:TextBox ID="txtMetaKeywords" runat="server" CssClass="blog-input" placeholder="کلیدواژه۱, کلیدواژه۲" />
                </div>
                <div class="full">
                    <label>پیش‌نمایش نتیجهٔ گوگل</label>
                    <div class="seo-preview">
                        <div class="g-title" id="gTitle">عنوان مقاله شما</div>
                        <div class="g-url" id="gUrl">https://site.com/blog/slug</div>
                        <div class="g-desc" id="gDesc">توضیحات متا اینجا نمایش داده می‌شود...</div>
                    </div>
                </div>
            </div>
        </div>

        <%-- ---------- دکمه‌های ذخیره ---------- --%>
        <div class="blog-card" style="display:flex;gap:12px;flex-wrap:wrap">
            <asp:Button ID="btnSaveDraft" runat="server" Text="ذخیره پیش‌نویس" CssClass="btn btn-secondary"
                OnClientClick="return syncEditor();" OnClick="btnSaveDraft_Click" />
            <asp:Button ID="btnPublish" runat="server" Text="انتشار مقاله" CssClass="btn btn-primary"
                OnClientClick="return syncEditor();" OnClick="btnPublish_Click" />
            <asp:Button ID="btnCancel" runat="server" Text="انصراف" CssClass="btn btn-danger" CausesValidation="false" OnClick="btnBackToList_Click" />
        </div>

        <%-- ---------- مدیریت رسانه‌ها (فقط بعد از ذخیرهٔ مقاله) ---------- --%>
        <asp:Panel ID="pnlMedia" runat="server" Visible="false">

            <%-- تصاویر --%>
            <div class="blog-card">
                <h3 style="margin-top:0"><i class="fas fa-images"></i> گالری تصاویر</h3>
                <div id="dropzone" class="dropzone" onclick="document.getElementById('<%= fuImages.ClientID %>').click();">
                    <i class="fas fa-cloud-arrow-up" style="font-size:28px"></i>
                    <div style="margin-top:8px">تصاویر را اینجا بکشید و رها کنید یا کلیک کنید</div>
                </div>
                <div style="margin-top:10px">
                    <asp:FileUpload ID="fuImages" runat="server" AllowMultiple="true" accept="image/*" CssClass="blog-input" />
                    <asp:Button ID="btnUploadImages" runat="server" Text="آپلود تصاویر" CssClass="btn btn-primary btn-sm" style="margin-top:8px" OnClick="btnUploadImages_Click" />
                </div>

                <asp:Repeater ID="rptImages" runat="server" OnItemCommand="rptImages_ItemCommand">
                    <HeaderTemplate><div class="media-grid"></HeaderTemplate>
                    <ItemTemplate>
                        <div class="media-item">
                            <img src='<%# ResolveImg(Eval("ImageUrl")) %>' alt="" />
                            <%# Convert.ToBoolean(Eval("IsFeatured")) ? "<div class='badge-pill badge-feat' style='margin-top:6px'>شاخص</div>" : "" %>
                            <div style="margin-top:6px">
                                <input type="text" class="blog-input" name='imgAlt_<%# Eval("Id") %>' value='<%# Server.HtmlEncode(Convert.ToString(Eval("AltText"))) %>' placeholder="AltText" />
                                <input type="text" class="blog-input" name='imgCap_<%# Eval("Id") %>' value='<%# Server.HtmlEncode(Convert.ToString(Eval("Caption"))) %>' placeholder="Caption" style="margin-top:5px" />
                                <input type="text" class="blog-input" name='imgSort_<%# Eval("Id") %>' value='<%# Eval("SortOrder") %>' placeholder="ترتیب" style="margin-top:5px;direction:ltr" />
                            </div>
                            <div style="margin-top:8px;display:flex;gap:6px">
                                <asp:LinkButton runat="server" CssClass="btn btn-secondary btn-sm" CommandName="SetFeatured" CommandArgument='<%# Eval("Id") %>'><i class="fas fa-star"></i></asp:LinkButton>
                                <asp:LinkButton runat="server" CssClass="btn btn-danger btn-sm" CommandName="DelImage" CommandArgument='<%# Eval("Id") %>'
                                    OnClientClick="return confirm('حذف این تصویر؟');"><i class="fas fa-trash"></i></asp:LinkButton>
                            </div>
                        </div>
                    </ItemTemplate>
                    <FooterTemplate></div></FooterTemplate>
                </asp:Repeater>
                <asp:Button ID="btnSaveImagesMeta" runat="server" Text="ذخیره ترتیب و توضیحات تصاویر" CssClass="btn btn-secondary btn-sm" style="margin-top:12px" OnClick="btnSaveImagesMeta_Click" />
            </div>

            <%-- ویدیوها --%>
            <div class="blog-card">
                <h3 style="margin-top:0"><i class="fas fa-video"></i> ویدیوها (آپارات / یوتیوب / آپلود)</h3>
                <div class="frm-grid">
                    <div><label>عنوان ویدیو</label><asp:TextBox ID="txtVideoTitle" runat="server" CssClass="blog-input" /></div>
                    <div><label>لینک ویدیو (آپارات/یوتیوب)</label><asp:TextBox ID="txtVideoUrl" runat="server" CssClass="blog-input" style="direction:ltr" placeholder="https://www.aparat.com/v/... یا https://youtu.be/..." /></div>
                    <div class="full"><label>توضیح</label><asp:TextBox ID="txtVideoDesc" runat="server" CssClass="blog-input" /></div>
                    <div><label>یا آپلود فایل ویدیو</label><asp:FileUpload ID="fuVideo" runat="server" CssClass="blog-input" accept="video/*" /></div>
                    <div style="display:flex;align-items:flex-end">
                        <asp:Button ID="btnAddVideo" runat="server" Text="افزودن ویدیو" CssClass="btn btn-primary" OnClick="btnAddVideo_Click" />
                    </div>
                </div>
                <asp:Repeater ID="rptVideos" runat="server" OnItemCommand="rptVideos_ItemCommand">
                    <HeaderTemplate><div class="media-grid" style="margin-top:14px"></HeaderTemplate>
                    <ItemTemplate>
                        <div class="media-item">
                            <div style="font-weight:700"><%# Server.HtmlEncode(Convert.ToString(Eval("Title"))) %></div>
                            <div style="font-size:11px;direction:ltr;text-align:right;color:#888;word-break:break-all"><%# Server.HtmlEncode(Convert.ToString(Eval("VideoUrl"))) %></div>
                            <div style="margin-top:8px;display:flex;gap:6px;align-items:center">
                                <span class="stat-chip">ترتیب: <%# Eval("SortOrder") %></span>
                                <asp:LinkButton runat="server" CssClass="btn btn-danger btn-sm" CommandName="DelVideo" CommandArgument='<%# Eval("Id") %>'
                                    OnClientClick="return confirm('حذف این ویدیو؟');"><i class="fas fa-trash"></i></asp:LinkButton>
                            </div>
                        </div>
                    </ItemTemplate>
                    <FooterTemplate></div></FooterTemplate>
                </asp:Repeater>
            </div>

            <%-- فایل‌های ضمیمه --%>
            <div class="blog-card">
                <h3 style="margin-top:0"><i class="fas fa-paperclip"></i> فایل‌های ضمیمه (PDF / Word / Excel / ZIP)</h3>
                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
                    <asp:FileUpload ID="fuAttachment" runat="server" CssClass="blog-input" style="max-width:320px"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" />
                    <asp:Button ID="btnAddAttachment" runat="server" Text="آپلود فایل" CssClass="btn btn-primary" OnClick="btnAddAttachment_Click" />
                </div>
                <asp:Repeater ID="rptAttachments" runat="server" OnItemCommand="rptAttachments_ItemCommand">
                    <HeaderTemplate><table class="blog-table" style="margin-top:14px"><thead><tr><th>نام فایل</th><th>نوع</th><th>حجم</th><th>عملیات</th></tr></thead><tbody></HeaderTemplate>
                    <ItemTemplate>
                        <tr>
                            <td><i class="fas fa-file"></i> <%# Server.HtmlEncode(Convert.ToString(Eval("FileName"))) %></td>
                            <td><%# Server.HtmlEncode(Convert.ToString(Eval("FileType"))) %></td>
                            <td><%# FormatSize(Eval("FileSize")) %></td>
                            <td>
                                <a class="icon-btn ib-view" href='<%# ResolveImg(Eval("FileUrl")) %>' target="_blank" download title="دانلود"><i class="fas fa-download"></i></a>
                                <asp:LinkButton runat="server" CssClass="icon-btn ib-del" CommandName="DelAttachment" CommandArgument='<%# Eval("Id") %>'
                                    OnClientClick="return confirm('حذف این فایل؟');"><i class="fas fa-trash"></i></asp:LinkButton>
                            </td>
                        </tr>
                    </ItemTemplate>
                    <FooterTemplate></tbody></table></FooterTemplate>
                </asp:Repeater>
            </div>

            <%-- نسخه‌ها --%>
            <div class="blog-card">
                <h3 style="margin-top:0"><i class="fas fa-clock-rotate-left"></i> تاریخچهٔ نسخه‌ها</h3>
                <asp:Repeater ID="rptVersions" runat="server" OnItemCommand="rptVersions_ItemCommand">
                    <HeaderTemplate><table class="blog-table"><thead><tr><th>نسخه</th><th>عنوان</th><th>ویرایش‌کننده</th><th>تاریخ</th><th>عملیات</th></tr></thead><tbody></HeaderTemplate>
                    <ItemTemplate>
                        <tr>
                            <td>#<%# Eval("VersionNumber") %></td>
                            <td><%# Server.HtmlEncode(Convert.ToString(Eval("Title"))) %></td>
                            <td><%# Server.HtmlEncode(Convert.ToString(Eval("ModifiedBy"))) %></td>
                            <td><%# FormatDate(Eval("ModifiedDate")) %></td>
                            <td>
                                <asp:LinkButton runat="server" CssClass="btn btn-secondary btn-sm" CommandName="RestoreVersion" CommandArgument='<%# Eval("Id") %>'
                                    OnClientClick="return confirm('بازگردانی به این نسخه؟ وضعیت فعلی به‌عنوان نسخهٔ جدید ذخیره می‌شود.');"><i class="fas fa-rotate-left"></i> بازیابی</asp:LinkButton>
                            </td>
                        </tr>
                    </ItemTemplate>
                    <FooterTemplate></tbody></table></FooterTemplate>
                </asp:Repeater>
                <asp:Panel ID="pnlNoVersions" runat="server" Visible="false">
                    <div style="color:#888;font-size:13px">هنوز نسخه‌ای ذخیره نشده است.</div>
                </asp:Panel>
            </div>
        </asp:Panel>
    </asp:Panel>

    <%-- ===================== CKEditor 5 + اسکریپت‌های صفحه ===================== --%>
    <link rel="stylesheet" href="https://cdn.ckeditor.com/ckeditor5/44.1.0/ckeditor5.css" />
    <script src="https://cdn.ckeditor.com/ckeditor5/44.1.0/ckeditor5.umd.js"></script>
    <script>
        var blogEditor = null;

        function slugify(text) {
            if (!text) return '';
            return text.toString().trim()
                .replace(/[‌\s]+/g, '-')        // فاصله و نیم‌فاصله => خط تیره
                .replace(/[^؀-ۿ\w\-]+/g, '') // فقط حروف فارسی/لاتین/عدد
                .replace(/\-\-+/g, '-')
                .replace(/^\-+|\-+$/g, '')
                .toLowerCase();
        }
        function genSlug() {
            var t = document.getElementById('txtTitle').value;
            document.getElementById('txtSlug').value = slugify(t);
            updateSeoPreview();
        }
        function autoSlug() {
            var slug = document.getElementById('txtSlug');
            // فقط اگر Slug خالی باشد خودکار بساز
            if (!slug.value) slug.value = slugify(document.getElementById('txtTitle').value);
            updateSeoPreview();
        }
        function updateSeoPreview() {
            var mt = document.getElementById('txtMetaTitle');
            var title = (mt && mt.value) ? mt.value : document.getElementById('txtTitle').value;
            var slug = document.getElementById('txtSlug').value || 'slug';
            var md = document.getElementById('txtMetaDescription');
            document.getElementById('gTitle').textContent = title || 'عنوان مقاله شما';
            document.getElementById('gUrl').textContent = 'https://site.com/blog/' + slug;
            document.getElementById('gDesc').textContent = (md && md.value) ? md.value : 'توضیحات متا اینجا نمایش داده می‌شود...';
        }

        // قبل از هر Postback، محتوای CKEditor را در hidden field بریز
        function syncEditor() {
            if (blogEditor) document.getElementById('hfContent').value = blogEditor.getData();
            return true;
        }

        function updateCounts(words) {
            document.getElementById('wordCount').textContent = words;
            document.getElementById('readTime').textContent = Math.max(1, Math.ceil(words / 200));
        }

        function buildTOC() {
            if (!blogEditor) return;
            var html = blogEditor.getData();
            var tmp = document.createElement('div'); tmp.innerHTML = html;
            var heads = tmp.querySelectorAll('h1,h2,h3,h4,h5,h6');
            if (!heads.length) { alert('سرفصلی (H1..H6) یافت نشد.'); return; }
            var toc = '<nav class="article-toc"><b>فهرست مطالب</b><ul>';
            heads.forEach(function (h, i) {
                var id = 'sec-' + (i + 1);
                h.setAttribute('id', id);
                var lvl = parseInt(h.tagName.substring(1));
                toc += '<li style="margin-right:' + ((lvl - 1) * 14) + 'px"><a href="#' + id + '">' + h.textContent + '</a></li>';
            });
            toc += '</ul></nav>';
            // نمایش پیش‌نمایش
            var box = document.getElementById('tocBox');
            box.style.display = 'block';
            box.innerHTML = toc;
            // درج در ابتدای محتوا
            blogEditor.setData(toc + tmp.innerHTML);
        }

        function toggleFullscreen() {
            var el = document.querySelector('.ck-editor');
            if (el) el.classList.toggle('ck-fullscreen');
        }

        // راه‌اندازی CKEditor 5
        function initEditor() {
            var ta = document.getElementById('editor');
            if (!ta || typeof CKEDITOR === 'undefined') return;
            const {
                ClassicEditor, Essentials, Paragraph, Heading, Bold, Italic, Underline,
                Link, BlockQuote, CodeBlock, List, Indent,
                Table, TableToolbar, TableColumnResize, TableCaption,
                Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageInsert, Base64UploadAdapter,
                MediaEmbed, SourceEditing, GeneralHtmlSupport, HtmlEmbed, WordCount, Alignment, Font, RemoveFormat
            } = CKEDITOR;

            ClassicEditor.create(ta, {
                licenseKey: 'GPL',
                plugins: [
                    Essentials, Paragraph, Heading, Bold, Italic, Underline,
                    Link, BlockQuote, CodeBlock, List, Indent,
                    Table, TableToolbar, TableColumnResize, TableCaption,
                    Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageInsert, Base64UploadAdapter,
                    MediaEmbed, SourceEditing, GeneralHtmlSupport, HtmlEmbed, WordCount, Alignment, Font, RemoveFormat
                ],
                toolbar: {
                    items: [
                        'undo', 'redo', '|',
                        'heading', '|',
                        'bold', 'italic', 'underline', 'removeFormat', '|',
                        'fontColor', 'fontBackgroundColor', 'alignment', '|',
                        'link', 'blockQuote', 'codeBlock', '|',
                        'bulletedList', 'numberedList', 'outdent', 'indent', '|',
                        'insertTable', 'insertImage', 'mediaEmbed', 'htmlEmbed', '|',
                        'sourceEditing'
                    ],
                    shouldNotGroupWhenFull: true
                },
                heading: {
                    options: [
                        { model: 'paragraph', title: 'پاراگراف', class: 'ck-heading_paragraph' },
                        { model: 'heading1', view: 'h1', title: 'H1', class: 'ck-heading_heading1' },
                        { model: 'heading2', view: 'h2', title: 'H2', class: 'ck-heading_heading2' },
                        { model: 'heading3', view: 'h3', title: 'H3', class: 'ck-heading_heading3' },
                        { model: 'heading4', view: 'h4', title: 'H4', class: 'ck-heading_heading4' },
                        { model: 'heading5', view: 'h5', title: 'H5', class: 'ck-heading_heading5' },
                        { model: 'heading6', view: 'h6', title: 'H6', class: 'ck-heading_heading6' }
                    ]
                },
                image: { toolbar: ['imageTextAlternative', 'toggleImageCaption', 'imageStyle:inline', 'imageStyle:block', 'imageStyle:side', 'resizeImage'] },
                table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'toggleTableCaption'] },
                mediaEmbed: { previewsInData: true },
                htmlSupport: { allow: [{ name: /.*/, attributes: true, classes: true, styles: true }] },
                language: { content: 'fa' }
            }).then(function (editor) {
                blogEditor = editor;
                // بارگذاری مقدار اولیه از hidden field (هنگام ویرایش)
                var initial = document.getElementById('hfContent').value;
                if (initial) editor.setData(initial);
                // شمارش کلمات
                try {
                    var wc = editor.plugins.get('WordCount');
                    updateCounts(wc.words);
                    wc.on('update', function (evt, stats) { updateCounts(stats.words); });
                } catch (e) { }
            }).catch(function (err) { console.error(err); });
        }

        // اجرا پس از بارگذاری (سازگار با Postback های ASP.NET)
        function pageInit() {
            if (document.getElementById('editor')) { initEditor(); updateSeoPreview(); }
            setupDropzone();
        }
        function setupDropzone() {
            var dz = document.getElementById('dropzone');
            var fu = document.querySelector('input[type=file][id$="fuImages"]');
            if (!dz || !fu) return;
            ['dragover', 'dragenter'].forEach(function (e) { dz.addEventListener(e, function (ev) { ev.preventDefault(); dz.classList.add('drag'); }); });
            ['dragleave', 'drop'].forEach(function (e) { dz.addEventListener(e, function (ev) { ev.preventDefault(); dz.classList.remove('drag'); }); });
            dz.addEventListener('drop', function (ev) {
                if (ev.dataTransfer && ev.dataTransfer.files.length) {
                    fu.files = ev.dataTransfer.files; // انتقال فایل‌ها به کنترل آپلود
                }
            });
        }
        if (document.readyState !== 'loading') pageInit();
        else document.addEventListener('DOMContentLoaded', pageInit);
    </script>
</asp:Content>
