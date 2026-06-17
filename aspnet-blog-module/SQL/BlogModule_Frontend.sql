/* ============================================================================
   استورد پروسیجرهای سمت کاربر (Front-End) برای صفحات Blog.aspx و BlogDetails.aspx
   فقط مقالات منتشرشده (IsActive = 1) را برمی‌گردانند.
   پیش‌نیاز: ابتدا BlogModule.sql اجرا شده باشد.
   ============================================================================ */
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   GetPublishedBlogPosts : لیست عمومی مقالات با جستجو، برچسب و صفحه‌بندی
       خروجی ۱: ردیف‌های صفحهٔ جاری
       خروجی ۲: تعداد کل
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.GetPublishedBlogPosts', N'P') IS NOT NULL DROP PROCEDURE dbo.GetPublishedBlogPosts;
GO
CREATE PROCEDURE dbo.GetPublishedBlogPosts
    @Search     NVARCHAR(300) = NULL,
    @Tag        NVARCHAR(200) = NULL,
    @OnlyFeatured BIT         = NULL,
    @PageIndex  INT           = 1,
    @PageSize   INT           = 9
AS
BEGIN
    SET NOCOUNT ON;
    IF @PageIndex < 1 SET @PageIndex = 1;
    IF @PageSize  < 1 SET @PageSize  = 9;

    ;WITH Filtered AS
    (
        SELECT Id, Title, Slug, Summary, ThumbnailImage, Tags, ViewCount,
               IsFeatured, Author, CreatedDate, PublishedDate
        FROM dbo.BlogPosts
        WHERE IsActive = 1
          AND (@Search IS NULL OR @Search = N''
                 OR Title   LIKE N'%' + @Search + N'%'
                 OR Summary LIKE N'%' + @Search + N'%'
                 OR Tags    LIKE N'%' + @Search + N'%')
          AND (@Tag IS NULL OR @Tag = N'' OR Tags LIKE N'%' + @Tag + N'%')
          AND (@OnlyFeatured IS NULL OR IsFeatured = @OnlyFeatured)
    )
    SELECT *
    FROM Filtered
    ORDER BY ISNULL(PublishedDate, CreatedDate) DESC, Id DESC
    OFFSET (@PageIndex - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT(*) AS TotalCount
    FROM dbo.BlogPosts
    WHERE IsActive = 1
      AND (@Search IS NULL OR @Search = N''
             OR Title   LIKE N'%' + @Search + N'%'
             OR Summary LIKE N'%' + @Search + N'%'
             OR Tags    LIKE N'%' + @Search + N'%')
      AND (@Tag IS NULL OR @Tag = N'' OR Tags LIKE N'%' + @Tag + N'%')
      AND (@OnlyFeatured IS NULL OR IsFeatured = @OnlyFeatured);
END
GO

/* ----------------------------------------------------------------------------
   GetBlogPostBySlug : نمایش یک مقاله + رسانه‌ها (فقط اگر منتشر شده باشد)
       همزمان شمارندهٔ بازدید را افزایش می‌دهد.
       خروجی: 0=مقاله 1=تصاویر 2=ویدیوها 3=فایل‌ها
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.GetBlogPostBySlug', N'P') IS NOT NULL DROP PROCEDURE dbo.GetBlogPostBySlug;
GO
CREATE PROCEDURE dbo.GetBlogPostBySlug
    @Slug NVARCHAR(350)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Id INT;
    SELECT @Id = Id FROM dbo.BlogPosts WHERE Slug = @Slug AND IsActive = 1;

    IF @Id IS NULL
    BEGIN
        SELECT * FROM dbo.BlogPosts WHERE 1 = 0;   -- خروجی خالی با همان ساختار
        RETURN;
    END

    UPDATE dbo.BlogPosts SET ViewCount = ViewCount + 1 WHERE Id = @Id;

    SELECT * FROM dbo.BlogPosts WHERE Id = @Id;
    SELECT * FROM dbo.BlogPostImages      WHERE BlogPostId = @Id ORDER BY SortOrder ASC, Id ASC;
    SELECT * FROM dbo.BlogPostVideos      WHERE BlogPostId = @Id ORDER BY SortOrder ASC, Id ASC;
    SELECT * FROM dbo.BlogPostAttachments WHERE BlogPostId = @Id ORDER BY Id DESC;
END
GO

/* ----------------------------------------------------------------------------
   GetRecentBlogPosts : جدیدترین مقالات (برای سایدبار صفحهٔ جزئیات)
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.GetRecentBlogPosts', N'P') IS NOT NULL DROP PROCEDURE dbo.GetRecentBlogPosts;
GO
CREATE PROCEDURE dbo.GetRecentBlogPosts
    @Take      INT = 5,
    @ExcludeId INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@Take) Id, Title, Slug, ThumbnailImage, ViewCount, CreatedDate, PublishedDate
    FROM dbo.BlogPosts
    WHERE IsActive = 1 AND Id <> @ExcludeId
    ORDER BY ISNULL(PublishedDate, CreatedDate) DESC;
END
GO

PRINT N'Front-end blog stored procedures installed successfully.';
GO
