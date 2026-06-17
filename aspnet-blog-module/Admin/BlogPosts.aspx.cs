using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

/// <summary>
/// ماژول مدیریت مقالات (CMS) - Web Forms (.NET Framework 4.6)
/// تمام دسترسی به دیتابیس از طریق Stored Procedureها و ADO.NET انجام می‌شود
/// (بدون Model / DAL / BLL / Repository / Service).
/// </summary>
public partial class Admin_BlogPosts : System.Web.UI.Page
{
    // -----------------------------------------------------------------
    // رشتهٔ اتصال: نام رشتهٔ اتصال پروژهٔ خود را در web.config اینجا بگذارید.
    // اگر نام دیگری دارید فقط همین ثابت را تغییر دهید.
    // -----------------------------------------------------------------
    private const string ConnName = "ShopDB";

    // پوشهٔ آپلودها (نسبت به ریشهٔ سایت)
    private const string UploadRoot = "~/Uploads/Blog/";

    private string ConnString
    {
        get
        {
            var cs = ConfigurationManager.ConnectionStrings[ConnName];
            if (cs == null)
                throw new ConfigurationErrorsException(
                    "رشتهٔ اتصال با نام '" + ConnName + "' در web.config یافت نشد. ثابت ConnName را اصلاح کنید.");
            return cs.ConnectionString;
        }
    }

    // ------------------------- وضعیت صفحه‌بندی -------------------------
    private int PageIndex
    {
        get { return ViewState["pi"] == null ? 1 : (int)ViewState["pi"]; }
        set { ViewState["pi"] = value; }
    }

    private int CurrentPostId
    {
        get { int id; return int.TryParse(hfPostId.Value, out id) ? id : 0; }
        set { hfPostId.Value = value.ToString(); }
    }

    private string CurrentUser
    {
        get { return User != null && User.Identity != null && User.Identity.IsAuthenticated ? User.Identity.Name : "مدیر"; }
    }

    // =================================================================
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            BindGrid();
            return;
        }

        // صفحه‌بندی: __doPostBack('goPage', شمارهٔ صفحه)
        if (Request["__EVENTTARGET"] == "goPage")
        {
            int p;
            if (int.TryParse(Request["__EVENTARGUMENT"], out p) && pnlList.Visible)
            {
                PageIndex = p;
                BindGrid();
            }
        }
    }

    #region ====================== لیست مقالات ======================

    private void BindGrid()
    {
        int pageSize = int.Parse(ddlPageSize.SelectedValue);

        bool? isActive = ParseNullableBool(ddlActive.SelectedValue);
        bool? isFeatured = ParseNullableBool(ddlFeatured.SelectedValue);

        string[] sort = ddlSort.SelectedValue.Split('|');
        string sortCol = sort.Length > 0 ? sort[0] : "CreatedDate";
        string sortDir = sort.Length > 1 ? sort[1] : "DESC";

        int total = 0;
        var ds = new DataSet();

        using (var cn = new SqlConnection(ConnString))
        using (var cmd = new SqlCommand("dbo.GetAllBlogPosts", cn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Search", (object)NullIfEmpty(txtSearch.Text.Trim()) ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsActive", (object)isActive ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsFeatured", (object)isFeatured ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Author", DBNull.Value);
            cmd.Parameters.AddWithValue("@SortColumn", sortCol);
            cmd.Parameters.AddWithValue("@SortDir", sortDir);
            cmd.Parameters.AddWithValue("@PageIndex", PageIndex);
            cmd.Parameters.AddWithValue("@PageSize", pageSize);

            using (var da = new SqlDataAdapter(cmd))
                da.Fill(ds);   // Tables[0]=ردیف‌ها ، Tables[1]=تعداد کل
        }

        DataTable dt = ds.Tables.Count > 0 ? ds.Tables[0] : new DataTable();
        if (ds.Tables.Count > 1 && ds.Tables[1].Rows.Count > 0)
            total = Convert.ToInt32(ds.Tables[1].Rows[0]["TotalCount"]);

        rptPosts.DataSource = dt;
        rptPosts.DataBind();

        pnlEmpty.Visible = dt.Rows.Count == 0;

        // اطلاعات و دکمه‌های صفحه‌بندی
        int totalPages = pageSize > 0 ? (int)Math.Ceiling(total / (double)pageSize) : 1;
        if (totalPages < 1) totalPages = 1;
        if (PageIndex > totalPages) { PageIndex = totalPages; }

        litCountInfo.Text = string.Format("مجموع {0} مقاله — صفحهٔ {1} از {2}", total, PageIndex, totalPages);
        litPager.Text = BuildPager(PageIndex, totalPages);
    }

    private string BuildPager(int current, int totalPages)
    {
        if (totalPages <= 1) return string.Empty;
        var sb = new System.Text.StringBuilder();

        // قبلی
        if (current > 1)
            sb.AppendFormat("<a href=\"javascript:__doPostBack('goPage','{0}')\">‹ قبلی</a>", current - 1);

        int start = Math.Max(1, current - 2);
        int end = Math.Min(totalPages, current + 2);
        if (start > 1) sb.AppendFormat("<a href=\"javascript:__doPostBack('goPage','{0}')\">1</a>", 1);
        if (start > 2) sb.Append("<span>...</span>");

        for (int i = start; i <= end; i++)
        {
            if (i == current) sb.AppendFormat("<span class=\"current\">{0}</span>", i);
            else sb.AppendFormat("<a href=\"javascript:__doPostBack('goPage','{0}')\">{0}</a>", i);
        }

        if (end < totalPages - 1) sb.Append("<span>...</span>");
        if (end < totalPages) sb.AppendFormat("<a href=\"javascript:__doPostBack('goPage','{0}')\">{1}</a>", totalPages, totalPages);

        // بعدی
        if (current < totalPages)
            sb.AppendFormat("<a href=\"javascript:__doPostBack('goPage','{0}')\">بعدی ›</a>", current + 1);

        return sb.ToString();
    }

    protected void btnSearch_Click(object sender, EventArgs e) { PageIndex = 1; BindGrid(); }
    protected void ddlPageSize_Changed(object sender, EventArgs e) { PageIndex = 1; BindGrid(); }

    protected void rptPosts_ItemCommand(object source, RepeaterCommandEventArgs e)
    {
        int id = Convert.ToInt32(e.CommandArgument);
        switch (e.CommandName)
        {
            case "ViewPost":
                ExecNonQuery("dbo.IncrementBlogPostViewCount", p => p.AddWithValue("@Id", id));
                LoadPostIntoForm(id, readOnlyView: true);
                break;
            case "EditPost":
                LoadPostIntoForm(id, readOnlyView: false);
                break;
            case "DeletePost":
                ExecNonQuery("dbo.DeleteBlogPost", p => p.AddWithValue("@Id", id));
                ShowMessage("مقاله حذف شد.", true);
                BindGrid();
                break;
            case "ToggleActive":
                ExecNonQuery("dbo.ToggleBlogPostActive", p => p.AddWithValue("@Id", id));
                BindGrid();
                break;
            case "ToggleFeatured":
                ExecNonQuery("dbo.ToggleBlogPostFeatured", p => p.AddWithValue("@Id", id));
                BindGrid();
                break;
        }
    }

    #endregion

    #region ====================== فرم ثبت/ویرایش ======================

    protected void btnNew_Click(object sender, EventArgs e)
    {
        ClearForm();
        CurrentPostId = 0;
        litFormTitle.Text = "مقاله جدید";
        pnlMedia.Visible = false;   // رسانه‌ها بعد از ذخیرهٔ اول
        SwitchToForm();
    }

    protected void btnBackToList_Click(object sender, EventArgs e)
    {
        SwitchToList();
        BindGrid();
    }

    /// <summary>بارگذاری یک مقاله و رسانه‌های آن در فرم</summary>
    private void LoadPostIntoForm(int id, bool readOnlyView)
    {
        var ds = new DataSet();
        using (var cn = new SqlConnection(ConnString))
        using (var cmd = new SqlCommand("dbo.GetBlogPostById", cn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Id", id);
            using (var da = new SqlDataAdapter(cmd))
                da.Fill(ds);   // 0=مقاله 1=تصاویر 2=ویدیوها 3=فایل‌ها 4=نسخه‌ها
        }

        if (ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0)
        {
            ShowMessage("مقاله یافت نشد.", false);
            return;
        }

        DataRow row = ds.Tables[0].Rows[0];
        CurrentPostId = id;
        txtTitle.Text = row["Title"].ToString();
        txtSlug.Text = row["Slug"].ToString();
        txtSummary.Text = row["Summary"].ToString();
        hfContent.Value = row["Content"].ToString();
        txtTags.Text = row["Tags"].ToString();
        txtAuthor.Text = row["Author"].ToString();
        txtArticleStyle.Text = row["ArticleStyle"].ToString();
        txtMetaTitle.Text = row["MetaTitle"].ToString();
        txtMetaDescription.Text = row["MetaDescription"].ToString();
        txtMetaKeywords.Text = row["MetaKeywords"].ToString();
        chkIsActive.Checked = row["IsActive"] != DBNull.Value && Convert.ToBoolean(row["IsActive"]);
        chkIsFeatured.Checked = row["IsFeatured"] != DBNull.Value && Convert.ToBoolean(row["IsFeatured"]);
        txtPublishedDate.Text = row["PublishedDate"] == DBNull.Value ? "" : Convert.ToDateTime(row["PublishedDate"]).ToString("yyyy-MM-dd HH:mm");

        string thumb = row["ThumbnailImage"].ToString();
        if (!string.IsNullOrEmpty(thumb)) { imgThumb.ImageUrl = ResolveImg(thumb); imgThumb.Visible = true; }
        else { imgThumb.Visible = false; }

        BindRepeater(rptImages, ds, 1);
        BindRepeater(rptVideos, ds, 2);
        BindRepeater(rptAttachments, ds, 3);
        int vCount = BindRepeater(rptVersions, ds, 4);
        pnlNoVersions.Visible = vCount == 0;

        litFormTitle.Text = readOnlyView ? "مشاهدهٔ مقاله: " + txtTitle.Text : "ویرایش مقاله: " + txtTitle.Text;
        pnlMedia.Visible = true;     // مقاله ذخیره‌شده است؛ مدیریت رسانه فعال
        SwitchToForm();
    }

    protected void btnSaveDraft_Click(object sender, EventArgs e) { SavePost(publish: false); }
    protected void btnPublish_Click(object sender, EventArgs e) { SavePost(publish: true); }

    private void SavePost(bool publish)
    {
        if (string.IsNullOrWhiteSpace(txtTitle.Text))
        {
            ShowMessage("عنوان مقاله الزامی است.", false);
            return;
        }

        string slug = string.IsNullOrWhiteSpace(txtSlug.Text) ? Slugify(txtTitle.Text) : txtSlug.Text.Trim();
        string content = hfContent.Value;

        bool isActive = chkIsActive.Checked || publish;
        bool isFeatured = chkIsFeatured.Checked;

        DateTime? published = ParseDate(txtPublishedDate.Text);
        if (publish && published == null) published = DateTime.Now;

        // آپلود تصویر شاخص (در صورت انتخاب)
        string thumb = imgThumb.Visible ? imgThumb.ImageUrl : null;
        if (fuThumbnail.HasFile)
            thumb = SaveUpload(fuThumbnail.PostedFile, "thumbs");

        int id = CurrentPostId;

        if (id == 0)
        {
            // درج
            using (var cn = new SqlConnection(ConnString))
            using (var cmd = new SqlCommand("dbo.InsertBlogPost", cn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                AddPostParams(cmd, slug, content, thumb, isActive, isFeatured, published);
                cn.Open();
                id = Convert.ToInt32(cmd.ExecuteScalar());
            }
            CurrentPostId = id;
            ShowMessage(publish ? "مقاله ایجاد و منتشر شد." : "پیش‌نویس مقاله ذخیره شد.", true);
        }
        else
        {
            // قبل از به‌روزرسانی، نسخهٔ فعلی را در تاریخچه ذخیره کن
            SaveVersionSnapshot(id);

            using (var cn = new SqlConnection(ConnString))
            using (var cmd = new SqlCommand("dbo.UpdateBlogPost", cn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Id", id);
                AddPostParams(cmd, slug, content, thumb, isActive, isFeatured, published);
                cn.Open();
                cmd.ExecuteNonQuery();
            }
            ShowMessage(publish ? "مقاله به‌روزرسانی و منتشر شد." : "تغییرات ذخیره شد.", true);
        }

        // بازخوانی فرم با داده‌های ذخیره‌شده (و فعال‌سازی مدیریت رسانه)
        LoadPostIntoForm(id, readOnlyView: false);
    }

    private void AddPostParams(SqlCommand cmd, string slug, string content, string thumb,
        bool isActive, bool isFeatured, DateTime? published)
    {
        cmd.Parameters.AddWithValue("@Title", txtTitle.Text.Trim());
        cmd.Parameters.AddWithValue("@Slug", slug);
        cmd.Parameters.AddWithValue("@Summary", (object)NullIfEmpty(txtSummary.Text) ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Content", (object)NullIfEmpty(content) ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ThumbnailImage", (object)NullIfEmpty(thumb) ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Tags", (object)NullIfEmpty(txtTags.Text) ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@IsActive", isActive);
        cmd.Parameters.AddWithValue("@IsFeatured", isFeatured);
        cmd.Parameters.AddWithValue("@PublishedDate", (object)published ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Author", (object)NullIfEmpty(txtAuthor.Text) ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@MetaTitle", (object)NullIfEmpty(txtMetaTitle.Text) ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@MetaDescription", (object)NullIfEmpty(txtMetaDescription.Text) ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@MetaKeywords", (object)NullIfEmpty(txtMetaKeywords.Text) ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ArticleStyle", (object)NullIfEmpty(txtArticleStyle.Text) ?? DBNull.Value);
    }

    private void SaveVersionSnapshot(int postId)
    {
        // تیتر و محتوای فعلی (داخل دیتابیس) را به‌عنوان نسخه ذخیره می‌کنیم
        using (var cn = new SqlConnection(ConnString))
        using (var cmd = new SqlCommand("dbo.InsertBlogPostVersion", cn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@BlogPostId", postId);
            cmd.Parameters.AddWithValue("@Title", txtTitle.Text.Trim());
            cmd.Parameters.AddWithValue("@Content", (object)NullIfEmpty(hfContent.Value) ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ModifiedBy", CurrentUser);
            cn.Open();
            cmd.ExecuteNonQuery();
        }
    }

    #endregion

    #region ====================== تصاویر ======================

    protected void btnUploadImages_Click(object sender, EventArgs e)
    {
        if (CurrentPostId == 0) { ShowMessage("ابتدا مقاله را ذخیره کنید.", false); return; }

        int count = 0, order = rptImages.Items.Count;
        foreach (HttpPostedFile f in fuImages.PostedFiles)   // AllowMultiple => PostedFiles
        {
            if (f == null || f.ContentLength == 0) continue;
            if (!IsImage(f.FileName)) continue;

            string url = SaveUpload(f, "images");
            ExecNonQuery("dbo.InsertBlogPostImage", p =>
            {
                p.AddWithValue("@BlogPostId", CurrentPostId);
                p.AddWithValue("@ImageUrl", url);
                p.AddWithValue("@AltText", DBNull.Value);
                p.AddWithValue("@Caption", DBNull.Value);
                p.AddWithValue("@SortOrder", order++);
                p.AddWithValue("@IsFeatured", false);
            });
            count++;
        }
        ShowMessage(count > 0 ? count + " تصویر آپلود شد." : "تصویری انتخاب نشد.", count > 0);
        ReloadMedia();
    }

    protected void rptImages_ItemCommand(object source, RepeaterCommandEventArgs e)
    {
        int id = Convert.ToInt32(e.CommandArgument);
        if (e.CommandName == "DelImage")
            ExecNonQuery("dbo.DeleteBlogPostImage", p => p.AddWithValue("@Id", id));
        else if (e.CommandName == "SetFeatured")
            ExecNonQuery("dbo.SetBlogPostFeaturedImage", p => p.AddWithValue("@Id", id));
        ReloadMedia();
    }

    protected void btnSaveImagesMeta_Click(object sender, EventArgs e)
    {
        // مقادیر AltText/Caption/SortOrder از input های name-دار (imgSort_/imgAlt_/imgCap_) خوانده می‌شوند
        foreach (string key in Request.Form.AllKeys)
        {
            if (key == null || !key.StartsWith("imgSort_")) continue;
            int id;
            if (!int.TryParse(key.Substring("imgSort_".Length), out id)) continue;

            int sort; int.TryParse(Request.Form["imgSort_" + id], out sort);
            string alt = Request.Form["imgAlt_" + id];
            string cap = Request.Form["imgCap_" + id];

            ExecNonQuery("dbo.UpdateBlogPostImage", p =>
            {
                p.AddWithValue("@Id", id);
                p.AddWithValue("@AltText", (object)NullIfEmpty(alt) ?? DBNull.Value);
                p.AddWithValue("@Caption", (object)NullIfEmpty(cap) ?? DBNull.Value);
                p.AddWithValue("@SortOrder", sort);
            });
        }
        ShowMessage("ترتیب و توضیحات تصاویر ذخیره شد.", true);
        ReloadMedia();
    }

    #endregion

    #region ====================== ویدیوها ======================

    protected void btnAddVideo_Click(object sender, EventArgs e)
    {
        if (CurrentPostId == 0) { ShowMessage("ابتدا مقاله را ذخیره کنید.", false); return; }

        string url = txtVideoUrl.Text.Trim();
        if (fuVideo.HasFile) url = SaveUpload(fuVideo.PostedFile, "videos");

        if (string.IsNullOrEmpty(url)) { ShowMessage("لینک ویدیو یا فایل را وارد کنید.", false); return; }

        int order = rptVideos.Items.Count;
        ExecNonQuery("dbo.InsertBlogPostVideo", p =>
        {
            p.AddWithValue("@BlogPostId", CurrentPostId);
            p.AddWithValue("@VideoUrl", url);
            p.AddWithValue("@ThumbnailUrl", DBNull.Value);
            p.AddWithValue("@Title", (object)NullIfEmpty(txtVideoTitle.Text) ?? DBNull.Value);
            p.AddWithValue("@Description", (object)NullIfEmpty(txtVideoDesc.Text) ?? DBNull.Value);
            p.AddWithValue("@SortOrder", order);
        });

        txtVideoUrl.Text = txtVideoTitle.Text = txtVideoDesc.Text = "";
        ShowMessage("ویدیو افزوده شد.", true);
        ReloadMedia();
    }

    protected void rptVideos_ItemCommand(object source, RepeaterCommandEventArgs e)
    {
        if (e.CommandName == "DelVideo")
            ExecNonQuery("dbo.DeleteBlogPostVideo", p => p.AddWithValue("@Id", Convert.ToInt32(e.CommandArgument)));
        ReloadMedia();
    }

    #endregion

    #region ====================== فایل‌های ضمیمه ======================

    protected void btnAddAttachment_Click(object sender, EventArgs e)
    {
        if (CurrentPostId == 0) { ShowMessage("ابتدا مقاله را ذخیره کنید.", false); return; }
        if (!fuAttachment.HasFile) { ShowMessage("فایلی انتخاب نشد.", false); return; }

        string ext = Path.GetExtension(fuAttachment.FileName).ToLowerInvariant();
        string[] allowed = { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip" };
        if (Array.IndexOf(allowed, ext) < 0) { ShowMessage("فرمت فایل مجاز نیست (PDF/Word/Excel/ZIP).", false); return; }

        string url = SaveUpload(fuAttachment.PostedFile, "files");
        ExecNonQuery("dbo.InsertBlogPostAttachment", p =>
        {
            p.AddWithValue("@BlogPostId", CurrentPostId);
            p.AddWithValue("@FileName", Path.GetFileName(fuAttachment.FileName));
            p.AddWithValue("@FileUrl", url);
            p.AddWithValue("@FileSize", (long)fuAttachment.PostedFile.ContentLength);
            p.AddWithValue("@FileType", ext.TrimStart('.').ToUpperInvariant());
        });
        ShowMessage("فایل ضمیمه شد.", true);
        ReloadMedia();
    }

    protected void rptAttachments_ItemCommand(object source, RepeaterCommandEventArgs e)
    {
        if (e.CommandName == "DelAttachment")
            ExecNonQuery("dbo.DeleteBlogPostAttachment", p => p.AddWithValue("@Id", Convert.ToInt32(e.CommandArgument)));
        ReloadMedia();
    }

    #endregion

    #region ====================== نسخه‌ها ======================

    protected void rptVersions_ItemCommand(object source, RepeaterCommandEventArgs e)
    {
        if (e.CommandName == "RestoreVersion")
        {
            int versionId = Convert.ToInt32(e.CommandArgument);
            ExecNonQuery("dbo.RestoreBlogPostVersion", p =>
            {
                p.AddWithValue("@VersionId", versionId);
                p.AddWithValue("@ModifiedBy", CurrentUser);
            });
            ShowMessage("نسخهٔ انتخاب‌شده بازیابی شد.", true);
            LoadPostIntoForm(CurrentPostId, readOnlyView: false);
        }
    }

    #endregion

    #region ====================== کمکی‌ها (ADO.NET / UI) ======================

    private void ReloadMedia()
    {
        if (CurrentPostId > 0) LoadPostIntoForm(CurrentPostId, readOnlyView: false);
    }

    private void ExecNonQuery(string sp, Action<SqlParameterCollection> fill)
    {
        using (var cn = new SqlConnection(ConnString))
        using (var cmd = new SqlCommand(sp, cn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            fill(cmd.Parameters);
            cn.Open();
            cmd.ExecuteNonQuery();
        }
    }

    /// <summary>اتصال جدول شمارهٔ index از DataSet به یک Repeater و برگرداندن تعداد ردیف</summary>
    private static int BindRepeater(Repeater rpt, DataSet ds, int index)
    {
        DataTable t = ds.Tables.Count > index ? ds.Tables[index] : new DataTable();
        rpt.DataSource = t;
        rpt.DataBind();
        return t.Rows.Count;
    }

    /// <summary>ذخیرهٔ فایل آپلودی روی دیسک و برگرداندن مسیر نسبی</summary>
    private string SaveUpload(HttpPostedFile file, string subFolder)
    {
        string virtualDir = UploadRoot + subFolder + "/";
        string physicalDir = Server.MapPath(virtualDir);
        if (!Directory.Exists(physicalDir)) Directory.CreateDirectory(physicalDir);

        string ext = Path.GetExtension(file.FileName);
        string name = Guid.NewGuid().ToString("N") + ext;
        file.SaveAs(Path.Combine(physicalDir, name));

        // مسیر نسبی قابل استفاده در src/href
        return VirtualPathUtility.ToAbsolute(virtualDir + name);
    }

    private void SwitchToForm() { pnlList.Visible = false; pnlForm.Visible = true; }
    private void SwitchToList() { pnlList.Visible = true; pnlForm.Visible = false; }

    private void ClearForm()
    {
        txtTitle.Text = txtSlug.Text = txtSummary.Text = txtTags.Text = txtAuthor.Text = "";
        txtArticleStyle.Text = txtMetaTitle.Text = txtMetaDescription.Text = txtMetaKeywords.Text = "";
        txtPublishedDate.Text = "";
        hfContent.Value = "";
        chkIsActive.Checked = false;
        chkIsFeatured.Checked = false;
        imgThumb.Visible = false;
        rptImages.DataSource = null; rptImages.DataBind();
        rptVideos.DataSource = null; rptVideos.DataBind();
        rptAttachments.DataSource = null; rptAttachments.DataBind();
        rptVersions.DataSource = null; rptVersions.DataBind();
    }

    private void ShowMessage(string text, bool ok)
    {
        litMessage.Text = string.Format("<div class='toast-msg {0}'>{1}</div>",
            ok ? "toast-ok" : "toast-err", Server.HtmlEncode(text));
    }

    // ---------------- توابع کمکی استاتیک برای DataBinding در .aspx ----------------

    protected string GetThumb(object val)
    {
        string s = val == null ? "" : val.ToString();
        return string.IsNullOrEmpty(s)
            ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='42'><rect width='100%' height='100%' fill='%23e1e8ed'/></svg>"
            : ResolveImg(s);
    }

    protected string ResolveImg(object val)
    {
        string s = val == null ? "" : val.ToString();
        if (string.IsNullOrEmpty(s)) return "";
        if (s.StartsWith("http") || s.StartsWith("data:") || s.StartsWith("/")) return s;
        if (s.StartsWith("~")) return ResolveUrl(s);
        return s;
    }

    protected string FormatDate(object val)
    {
        if (val == null || val == DBNull.Value) return "-";
        DateTime d = Convert.ToDateTime(val);
        // نمایش میلادی ساده؛ در صورت نیاز PersianCalendar اعمال کنید
        return d.ToString("yyyy/MM/dd HH:mm");
    }

    protected string FormatSize(object val)
    {
        if (val == null || val == DBNull.Value) return "-";
        long bytes = Convert.ToInt64(val);
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024.0).ToString("0.0") + " KB";
        return (bytes / 1024.0 / 1024.0).ToString("0.0") + " MB";
    }

    // ---------------- ابزارهای عمومی ----------------

    private static string NullIfEmpty(string s) { return string.IsNullOrWhiteSpace(s) ? null : s.Trim(); }

    private static bool? ParseNullableBool(string s)
    {
        if (s == "1") return true;
        if (s == "0") return false;
        return null;
    }

    private static DateTime? ParseDate(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        DateTime d;
        if (DateTime.TryParse(s, out d)) return d;
        return null;
    }

    private static bool IsImage(string fileName)
    {
        string ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".webp" || ext == ".bmp";
    }

    /// <summary>تولید Slug سازگار با فارسی و لاتین</summary>
    private static string Slugify(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return Guid.NewGuid().ToString("N").Substring(0, 8);
        var sb = new System.Text.StringBuilder();
        foreach (char c in text.Trim().ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(c)) sb.Append(c);
            else if (c == ' ' || c == '-' || c == '_' || c == '‌') sb.Append('-');
        }
        string slug = sb.ToString();
        while (slug.Contains("--")) slug = slug.Replace("--", "-");
        return slug.Trim('-');
    }

    #endregion
}
