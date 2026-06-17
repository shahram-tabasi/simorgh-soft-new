using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Text;
using System.Web;
using System.Web.UI;

/// <summary>
/// صفحهٔ عمومی لیست مقالات (سمت کاربر) - وابسته به User.master
/// فقط مقالات منتشرشده (IsActive = 1) را نمایش می‌دهد.
/// جستجو و صفحه‌بندی از طریق QueryString (?q=...&page=...) انجام می‌شود تا آدرس‌ها قابل اشتراک باشند.
/// </summary>
public partial class Blog : System.Web.UI.Page
{
    private const string ConnName = "ShopDB";
    private const int PageSize = 9;

    private string ConnString { get { return ConfigurationManager.ConnectionStrings[ConnName].ConnectionString; } }

    private string Q { get { return (Request.QueryString["q"] ?? "").Trim(); } }
    private int PageIndex
    {
        get { int p; return int.TryParse(Request.QueryString["page"], out p) && p > 0 ? p : 1; }
    }

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            txtSearch.Text = Q;
            BindList();
        }
    }

    protected void btnSearch_Click(object sender, EventArgs e)
    {
        Response.Redirect("Blog.aspx?q=" + Server.UrlEncode(txtSearch.Text.Trim()));
    }

    private void BindList()
    {
        int total = 0;
        var ds = new DataSet();

        using (var cn = new SqlConnection(ConnString))
        using (var cmd = new SqlCommand("dbo.GetPublishedBlogPosts", cn))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Search", (object)NullIfEmpty(Q) ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Tag", DBNull.Value);
            cmd.Parameters.AddWithValue("@OnlyFeatured", DBNull.Value);
            cmd.Parameters.AddWithValue("@PageIndex", PageIndex);
            cmd.Parameters.AddWithValue("@PageSize", PageSize);
            using (var da = new SqlDataAdapter(cmd)) da.Fill(ds);
        }

        DataTable dt = ds.Tables.Count > 0 ? ds.Tables[0] : new DataTable();
        if (ds.Tables.Count > 1 && ds.Tables[1].Rows.Count > 0)
            total = Convert.ToInt32(ds.Tables[1].Rows[0]["TotalCount"]);

        rptPosts.DataSource = dt;
        rptPosts.DataBind();

        pnlPosts.Visible = dt.Rows.Count > 0;
        pnlEmpty.Visible = dt.Rows.Count == 0;

        if (!string.IsNullOrEmpty(Q))
            litActiveFilter.Text = string.Format(
                "<div style='margin-bottom:20px;font-size:14px;color:#777'>نتایج جستجو برای: <b>{0}</b> — <a href='Blog.aspx' style='color:var(--primary-color)'>پاک‌کردن</a></div>",
                Server.HtmlEncode(Q));

        int totalPages = (int)Math.Ceiling(total / (double)PageSize);
        litPager.Text = BuildPager(PageIndex, totalPages);
    }

    private string BuildPager(int current, int totalPages)
    {
        if (totalPages <= 1) return "";
        var sb = new StringBuilder();
        string baseUrl = "Blog.aspx?" + (string.IsNullOrEmpty(Q) ? "" : "q=" + Server.UrlEncode(Q) + "&") + "page=";

        if (current > 1) sb.AppendFormat("<a href='{0}{1}'>‹ قبلی</a>", baseUrl, current - 1);
        for (int i = 1; i <= totalPages; i++)
        {
            if (i == current) sb.AppendFormat("<span class='current'>{0}</span>", i);
            else sb.AppendFormat("<a href='{0}{1}'>{1}</a>", baseUrl, i);
        }
        if (current < totalPages) sb.AppendFormat("<a href='{0}{1}'>بعدی ›</a>", baseUrl, current + 1);
        return sb.ToString();
    }

    // ---------------- توابع کمکی برای DataBinding ----------------

    protected string DetailUrl(object slug)
    {
        return "BlogDetails.aspx?slug=" + Server.UrlEncode(Convert.ToString(slug));
    }

    protected string GetThumb(object val)
    {
        string s = val == null ? "" : val.ToString();
        if (string.IsNullOrEmpty(s))
            return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='190'><rect width='100%' height='100%' fill='%23e1e8ed'/><text x='50%' y='50%' fill='%23999' font-size='18' text-anchor='middle' dy='.3em'>بدون تصویر</text></svg>";
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

    protected string Summarize(object val, int max)
    {
        string s = val == null ? "" : val.ToString();
        if (s.Length <= max) return s;
        return s.Substring(0, max) + "…";
    }

    protected string RenderTags(object val)
    {
        string s = val == null ? "" : val.ToString();
        if (string.IsNullOrWhiteSpace(s)) return "";
        var sb = new StringBuilder();
        foreach (var t in s.Split(','))
        {
            string tag = t.Trim();
            if (tag.Length == 0) continue;
            sb.AppendFormat("<a href='Blog.aspx?q={0}'>#{1}</a>",
                Server.UrlEncode(tag), Server.HtmlEncode(tag));
        }
        return sb.ToString();
    }

    protected string FormatDate(object published, object created)
    {
        object val = (published != null && published != DBNull.Value) ? published : created;
        if (val == null || val == DBNull.Value) return "-";
        return Convert.ToDateTime(val).ToString("yyyy/MM/dd");
    }

    private static string NullIfEmpty(string s) { return string.IsNullOrWhiteSpace(s) ? null : s.Trim(); }
}
