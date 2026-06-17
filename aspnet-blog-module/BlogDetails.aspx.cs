using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI;
using System.Web.UI.HtmlControls;

/// <summary>
/// صفحهٔ نمایش یک مقاله (سمت کاربر) - وابسته به User.master
/// مقاله را با Slug می‌خواند، بازدید را افزایش می‌دهد و رسانه‌ها/سئو را نمایش می‌دهد.
/// </summary>
public partial class BlogDetails : System.Web.UI.Page
{
    private const string ConnName = "ShopDB";

    private string ConnString { get { return ConfigurationManager.ConnectionStrings[ConnName].ConnectionString; } }

    protected void Page_Load(object sender, EventArgs e)
    {
        if (IsPostBack) return;

        string slug = (Request.QueryString["slug"] ?? "").Trim();
        if (string.IsNullOrEmpty(slug)) { Response.Redirect("Blog.aspx"); return; }

        LoadArticle(slug);
    }

    private void LoadArticle(string slug)
    {
        var ds = new DataSet();
        using (var cn = new SqlConnection(ConnString))
        using (var cmd = new SqlCommand("dbo.GetBlogPostBySlug", cn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Slug", slug);
            using (var da = new SqlDataAdapter(cmd)) da.Fill(ds);
        }

        if (ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0)
        {
            pnlNotFound.Visible = true;
            litTitleTag.Text = "مقاله یافت نشد";
            return;
        }

        DataRow row = ds.Tables[0].Rows[0];
        int postId = Convert.ToInt32(row["Id"]);
        string title = Convert.ToString(row["Title"]);
        string content = Convert.ToString(row["Content"]);

        // عنوان و سئو
        litTitleTag.Text = Server.HtmlEncode(NonEmpty(Convert.ToString(row["MetaTitle"]), title));
        litTitle.Text = Server.HtmlEncode(title);
        litCrumb.Text = Server.HtmlEncode(title);
        AddMeta("description", FirstNonEmpty(Convert.ToString(row["MetaDescription"]), Convert.ToString(row["Summary"]), StripHtml(content)));
        AddMeta("keywords", FirstNonEmpty(Convert.ToString(row["MetaKeywords"]), Convert.ToString(row["Tags"])));

        // متادیتا
        litAuthor.Text = Server.HtmlEncode(NonEmpty(Convert.ToString(row["Author"]), "نویسنده"));
        litViews.Text = Convert.ToString(row["ViewCount"]);
        object dateVal = row["PublishedDate"] != DBNull.Value ? row["PublishedDate"] : row["CreatedDate"];
        litDate.Text = dateVal == DBNull.Value ? "-" : Convert.ToDateTime(dateVal).ToString("yyyy/MM/dd");
        litReadTime.Text = ReadingTime(content).ToString();

        // استایل اختصاصی مقاله
        string style = Convert.ToString(row["ArticleStyle"]);
        if (!string.IsNullOrWhiteSpace(style))
            litArticleStyle.Text = "<style>" + style + "</style>";

        // تصویر شاخص
        string thumb = Convert.ToString(row["ThumbnailImage"]);
        if (!string.IsNullOrEmpty(thumb)) { imgHero.ImageUrl = ResolveImg(thumb); imgHero.Visible = true; }

        // فهرست مطالب + محتوا (با افزودن id به سرفصل‌ها)
        string toc;
        litContent.Text = BuildTocAndContent(content, out toc);
        litToc.Text = toc;

        // برچسب‌ها
        litTags.Text = RenderTagsBlock(Convert.ToString(row["Tags"]));

        // رسانه‌ها
        BindGallery(ds);
        BindVideos(ds);
        BindFiles(ds);

        // جدیدترین مقالات (سایدبار)
        BindRecent(postId);

        pnlArticle.Visible = true;
    }

    #region رسانه‌ها

    private void BindGallery(DataSet ds)
    {
        DataTable t = ds.Tables.Count > 1 ? ds.Tables[1] : null;
        if (t != null && t.Rows.Count > 0)
        {
            rptImages.DataSource = t; rptImages.DataBind();
            pnlGallery.Visible = true;
        }
    }

    private void BindVideos(DataSet ds)
    {
        DataTable t = ds.Tables.Count > 2 ? ds.Tables[2] : null;
        if (t != null && t.Rows.Count > 0)
        {
            rptVideos.DataSource = t; rptVideos.DataBind();
            pnlVideos.Visible = true;
        }
    }

    private void BindFiles(DataSet ds)
    {
        DataTable t = ds.Tables.Count > 3 ? ds.Tables[3] : null;
        if (t != null && t.Rows.Count > 0)
        {
            rptFiles.DataSource = t; rptFiles.DataBind();
            pnlFiles.Visible = true;
        }
    }

    private void BindRecent(int excludeId)
    {
        var dt = new DataTable();
        using (var cn = new SqlConnection(ConnString))
        using (var cmd = new SqlCommand("dbo.GetRecentBlogPosts", cn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Take", 5);
            cmd.Parameters.AddWithValue("@ExcludeId", excludeId);
            using (var da = new SqlDataAdapter(cmd)) da.Fill(dt);
        }
        rptRecent.DataSource = dt; rptRecent.DataBind();
    }

    #endregion

    #region توابع کمکی

    /// <summary>افزودن id به سرفصل‌ها و ساخت فهرست مطالب</summary>
    private string BuildTocAndContent(string html, out string toc)
    {
        toc = "";
        if (string.IsNullOrEmpty(html)) return "";

        var matches = Regex.Matches(html, @"<(h[1-3])[^>]*>(.*?)</\1>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        if (matches.Count >= 3)
        {
            var sb = new StringBuilder("<div class='toc-card'><b><i class='fas fa-list-ol'></i> فهرست مطالب</b><ul style='margin:0;padding-right:18px'>");
            int i = 0;
            foreach (Match m in matches)
            {
                string id = "sec-" + (++i);
                string text = StripHtml(m.Groups[2].Value).Trim();
                int level = int.Parse(m.Groups[1].Value.Substring(1));
                // افزودن id به همان سرفصل در متن
                html = ReplaceFirst(html, m.Value, "<" + m.Groups[1].Value + " id='" + id + "'>" + m.Groups[2].Value + "</" + m.Groups[1].Value + ">");
                sb.AppendFormat("<li style='margin:4px 0;padding-right:{0}px'><a href='#{1}' style='color:var(--primary-color);text-decoration:none'>{2}</a></li>",
                    (level - 1) * 14, id, Server.HtmlEncode(text));
            }
            sb.Append("</ul></div>");
            toc = sb.ToString();
        }
        return html;
    }

    private string RenderTagsBlock(string tags)
    {
        if (string.IsNullOrWhiteSpace(tags)) return "";
        var sb = new StringBuilder("<div class='article-tags'>");
        foreach (var t in tags.Split(','))
        {
            string tag = t.Trim();
            if (tag.Length == 0) continue;
            sb.AppendFormat("<a href='Blog.aspx?q={0}'>#{1}</a>", Server.UrlEncode(tag), Server.HtmlEncode(tag));
        }
        sb.Append("</div>");
        return sb.ToString();
    }

    /// <summary>تبدیل لینک ویدیو (آپارات/یوتیوب/فایل) به HTML قابل نمایش</summary>
    protected string RenderVideo(object urlObj)
    {
        string url = Convert.ToString(urlObj);
        if (string.IsNullOrWhiteSpace(url)) return "";

        var yt = Regex.Match(url, @"(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/))([\w\-]{6,})", RegexOptions.IgnoreCase);
        if (yt.Success)
            return "<iframe src='https://www.youtube.com/embed/" + yt.Groups[1].Value + "' allowfullscreen></iframe>";

        var ap = Regex.Match(url, @"aparat\.com/v/([\w\d]+)", RegexOptions.IgnoreCase);
        if (ap.Success)
            return "<iframe src='https://www.aparat.com/video/video/embed/videohash/" + ap.Groups[1].Value + "/vt/frame' allowfullscreen></iframe>";

        string lower = url.ToLowerInvariant();
        if (lower.EndsWith(".mp4") || lower.EndsWith(".webm") || lower.EndsWith(".ogg"))
            return "<video controls src='" + ResolveImg(url) + "'></video>";

        return "<a href='" + Server.HtmlEncode(url) + "' target='_blank' style='color:var(--primary-color)'>مشاهدهٔ ویدیو</a>";
    }

    protected string DetailUrl(object slug)
    {
        return "BlogDetails.aspx?slug=" + Server.UrlEncode(Convert.ToString(slug));
    }

    protected string GetThumb(object val)
    {
        string s = val == null ? "" : val.ToString();
        if (string.IsNullOrEmpty(s))
            return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='54'><rect width='100%' height='100%' fill='%23e1e8ed'/></svg>";
        return ResolveImg(s);
    }

    protected string ResolveImg(object val)
    {
        string s = val == null ? "" : val.ToString();
        if (string.IsNullOrEmpty(s)) return "";
        if (s.StartsWith("http") || s.StartsWith("data:") || s.StartsWith("/")) return s;
        if (s.StartsWith("~")) return ResolveUrl(s);
        return s;
    }

    protected string FormatDate(object published, object created)
    {
        object val = (published != null && published != DBNull.Value) ? published : created;
        if (val == null || val == DBNull.Value) return "-";
        return Convert.ToDateTime(val).ToString("yyyy/MM/dd");
    }

    protected string FormatSize(object val)
    {
        if (val == null || val == DBNull.Value) return "";
        long bytes = Convert.ToInt64(val);
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024.0).ToString("0.0") + " KB";
        return (bytes / 1024.0 / 1024.0).ToString("0.0") + " MB";
    }

    private void AddMeta(string name, string content)
    {
        if (string.IsNullOrWhiteSpace(content) || Page.Header == null) return;
        var meta = new HtmlMeta { Name = name, Content = Truncate(StripHtml(content), name == "description" ? 300 : 250) };
        Page.Header.Controls.Add(meta);
    }

    private static int ReadingTime(string html)
    {
        string text = StripHtml(html);
        int words = string.IsNullOrWhiteSpace(text) ? 0 : Regex.Matches(text, @"\S+").Count;
        return Math.Max(1, (int)Math.Ceiling(words / 200.0));
    }

    private static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html)) return "";
        string s = Regex.Replace(html, "<[^>]+>", " ");
        s = HttpUtility.HtmlDecode(s);
        return Regex.Replace(s, @"\s+", " ").Trim();
    }

    private static string Truncate(string s, int max)
    {
        if (string.IsNullOrEmpty(s) || s.Length <= max) return s;
        return s.Substring(0, max);
    }

    private static string ReplaceFirst(string text, string search, string replace)
    {
        int pos = text.IndexOf(search, StringComparison.Ordinal);
        if (pos < 0) return text;
        return text.Substring(0, pos) + replace + text.Substring(pos + search.Length);
    }

    private static string NonEmpty(string val, string fallback) { return string.IsNullOrWhiteSpace(val) ? fallback : val; }

    private static string FirstNonEmpty(params string[] vals)
    {
        foreach (var v in vals) if (!string.IsNullOrWhiteSpace(v)) return v;
        return "";
    }

    #endregion
}
