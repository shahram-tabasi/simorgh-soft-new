/* ============================================================================
   ماژول مدیریت مقالات (CMS) - اسکریپت کامل پایگاه داده
   SQL Server 2012+  (به‌خاطر استفاده از OFFSET / FETCH در صفحه‌بندی)
   ----------------------------------------------------------------------------
   شامل:
     - CREATE TABLE  (5 جدول)
     - FOREIGN KEY
     - INDEX
     - Stored Procedureها
     - نمونه INSERT / UPDATE / DELETE / SELECT
   ============================================================================ */

SET NOCOUNT ON;
GO

/* ============================================================================
   1) جدول اصلی مقالات
   ============================================================================ */
IF OBJECT_ID(N'dbo.BlogPosts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BlogPosts
    (
        Id              INT             IDENTITY(1,1) NOT NULL,
        Title           NVARCHAR(300)   NOT NULL,
        Slug            NVARCHAR(350)   NOT NULL,
        Summary         NVARCHAR(1000)  NULL,
        Content         NVARCHAR(MAX)   NULL,
        ThumbnailImage  NVARCHAR(500)   NULL,
        Tags            NVARCHAR(500)   NULL,
        ViewCount       INT             NOT NULL CONSTRAINT DF_BlogPosts_ViewCount   DEFAULT(0),
        IsActive        BIT             NOT NULL CONSTRAINT DF_BlogPosts_IsActive     DEFAULT(0),
        IsFeatured      BIT             NOT NULL CONSTRAINT DF_BlogPosts_IsFeatured   DEFAULT(0),
        CreatedDate     DATETIME        NOT NULL CONSTRAINT DF_BlogPosts_CreatedDate  DEFAULT(GETDATE()),
        UpdatedDate     DATETIME        NULL,
        PublishedDate   DATETIME        NULL,
        Author          NVARCHAR(150)   NULL,
        MetaTitle       NVARCHAR(300)   NULL,
        MetaDescription NVARCHAR(500)   NULL,
        MetaKeywords    NVARCHAR(500)   NULL,
        ArticleStyle    NVARCHAR(MAX)   NULL,
        CONSTRAINT PK_BlogPosts PRIMARY KEY CLUSTERED (Id ASC)
    );

    /* Slug باید یکتا باشد (برای SEO و آدرس‌دهی) */
    CREATE UNIQUE NONCLUSTERED INDEX UX_BlogPosts_Slug ON dbo.BlogPosts (Slug ASC);

    /* ایندکس‌های پرکاربرد برای فیلتر / مرتب‌سازی */
    CREATE NONCLUSTERED INDEX IX_BlogPosts_IsActive       ON dbo.BlogPosts (IsActive ASC);
    CREATE NONCLUSTERED INDEX IX_BlogPosts_IsFeatured     ON dbo.BlogPosts (IsFeatured ASC);
    CREATE NONCLUSTERED INDEX IX_BlogPosts_CreatedDate    ON dbo.BlogPosts (CreatedDate DESC);
    CREATE NONCLUSTERED INDEX IX_BlogPosts_PublishedDate  ON dbo.BlogPosts (PublishedDate DESC);
END
GO

/* ============================================================================
   2) جدول تصاویر مقاله
   ============================================================================ */
IF OBJECT_ID(N'dbo.BlogPostImages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BlogPostImages
    (
        Id          INT             IDENTITY(1,1) NOT NULL,
        BlogPostId  INT             NOT NULL,
        ImageUrl    NVARCHAR(500)   NOT NULL,
        AltText     NVARCHAR(300)   NULL,
        Caption     NVARCHAR(500)   NULL,
        SortOrder   INT             NOT NULL CONSTRAINT DF_BlogPostImages_SortOrder  DEFAULT(0),
        IsFeatured  BIT             NOT NULL CONSTRAINT DF_BlogPostImages_IsFeatured DEFAULT(0),
        CreatedDate DATETIME        NOT NULL CONSTRAINT DF_BlogPostImages_Created    DEFAULT(GETDATE()),
        CONSTRAINT PK_BlogPostImages PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT FK_BlogPostImages_BlogPosts FOREIGN KEY (BlogPostId)
            REFERENCES dbo.BlogPosts (Id) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX IX_BlogPostImages_BlogPostId ON dbo.BlogPostImages (BlogPostId ASC, SortOrder ASC);
END
GO

/* ============================================================================
   3) جدول ویدیوهای مقاله
   ============================================================================ */
IF OBJECT_ID(N'dbo.BlogPostVideos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BlogPostVideos
    (
        Id           INT            IDENTITY(1,1) NOT NULL,
        BlogPostId   INT            NOT NULL,
        VideoUrl     NVARCHAR(700)  NOT NULL,
        ThumbnailUrl NVARCHAR(500)  NULL,
        Title        NVARCHAR(300)  NULL,
        Description  NVARCHAR(1000) NULL,
        SortOrder    INT            NOT NULL CONSTRAINT DF_BlogPostVideos_SortOrder DEFAULT(0),
        CreatedDate  DATETIME       NOT NULL CONSTRAINT DF_BlogPostVideos_Created   DEFAULT(GETDATE()),
        CONSTRAINT PK_BlogPostVideos PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT FK_BlogPostVideos_BlogPosts FOREIGN KEY (BlogPostId)
            REFERENCES dbo.BlogPosts (Id) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX IX_BlogPostVideos_BlogPostId ON dbo.BlogPostVideos (BlogPostId ASC, SortOrder ASC);
END
GO

/* ============================================================================
   4) جدول فایل‌های ضمیمه مقاله
   ============================================================================ */
IF OBJECT_ID(N'dbo.BlogPostAttachments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BlogPostAttachments
    (
        Id          INT            IDENTITY(1,1) NOT NULL,
        BlogPostId  INT            NOT NULL,
        FileName    NVARCHAR(300)  NOT NULL,
        FileUrl     NVARCHAR(500)  NOT NULL,
        FileSize    BIGINT         NULL,
        FileType    NVARCHAR(100)  NULL,
        CreatedDate DATETIME       NOT NULL CONSTRAINT DF_BlogPostAttachments_Created DEFAULT(GETDATE()),
        CONSTRAINT PK_BlogPostAttachments PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT FK_BlogPostAttachments_BlogPosts FOREIGN KEY (BlogPostId)
            REFERENCES dbo.BlogPosts (Id) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX IX_BlogPostAttachments_BlogPostId ON dbo.BlogPostAttachments (BlogPostId ASC);
END
GO

/* ============================================================================
   5) جدول تاریخچه نسخه‌ها
   ============================================================================ */
IF OBJECT_ID(N'dbo.BlogPostVersions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BlogPostVersions
    (
        Id            INT            IDENTITY(1,1) NOT NULL,
        BlogPostId    INT            NOT NULL,
        Title         NVARCHAR(300)  NULL,
        Content       NVARCHAR(MAX)  NULL,
        ModifiedBy    NVARCHAR(150)  NULL,
        ModifiedDate  DATETIME       NOT NULL CONSTRAINT DF_BlogPostVersions_Modified DEFAULT(GETDATE()),
        VersionNumber INT            NOT NULL CONSTRAINT DF_BlogPostVersions_Version   DEFAULT(1),
        CONSTRAINT PK_BlogPostVersions PRIMARY KEY CLUSTERED (Id ASC),
        CONSTRAINT FK_BlogPostVersions_BlogPosts FOREIGN KEY (BlogPostId)
            REFERENCES dbo.BlogPosts (Id) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX IX_BlogPostVersions_BlogPostId ON dbo.BlogPostVersions (BlogPostId ASC, VersionNumber DESC);
END
GO

/* ============================================================================
   نمونه ALTER TABLE  (برای پروژه‌هایی که جدول از قبل وجود دارد و ستون کم دارد)
   در صورت نیاز کامنت را بردارید.
   ----------------------------------------------------------------------------
   IF COL_LENGTH('dbo.BlogPosts','ArticleStyle') IS NULL
       ALTER TABLE dbo.BlogPosts ADD ArticleStyle NVARCHAR(MAX) NULL;
   ============================================================================ */
GO


/* ############################################################################
   #                          STORED PROCEDURES                               #
   ############################################################################ */

/* ----------------------------------------------------------------------------
   InsertBlogPost  -> Id مقاله جدید را برمی‌گرداند
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.InsertBlogPost', N'P') IS NOT NULL DROP PROCEDURE dbo.InsertBlogPost;
GO
CREATE PROCEDURE dbo.InsertBlogPost
    @Title           NVARCHAR(300),
    @Slug            NVARCHAR(350),
    @Summary         NVARCHAR(1000) = NULL,
    @Content         NVARCHAR(MAX)  = NULL,
    @ThumbnailImage  NVARCHAR(500)  = NULL,
    @Tags            NVARCHAR(500)  = NULL,
    @IsActive        BIT            = 0,
    @IsFeatured      BIT            = 0,
    @PublishedDate   DATETIME       = NULL,
    @Author          NVARCHAR(150)  = NULL,
    @MetaTitle       NVARCHAR(300)  = NULL,
    @MetaDescription NVARCHAR(500)  = NULL,
    @MetaKeywords    NVARCHAR(500)  = NULL,
    @ArticleStyle    NVARCHAR(MAX)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.BlogPosts
        (Title, Slug, Summary, Content, ThumbnailImage, Tags, IsActive, IsFeatured,
         CreatedDate, PublishedDate, Author, MetaTitle, MetaDescription, MetaKeywords, ArticleStyle)
    VALUES
        (@Title, @Slug, @Summary, @Content, @ThumbnailImage, @Tags, @IsActive, @IsFeatured,
         GETDATE(), @PublishedDate, @Author, @MetaTitle, @MetaDescription, @MetaKeywords, @ArticleStyle);

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewId;
END
GO

/* ----------------------------------------------------------------------------
   UpdateBlogPost
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.UpdateBlogPost', N'P') IS NOT NULL DROP PROCEDURE dbo.UpdateBlogPost;
GO
CREATE PROCEDURE dbo.UpdateBlogPost
    @Id              INT,
    @Title           NVARCHAR(300),
    @Slug            NVARCHAR(350),
    @Summary         NVARCHAR(1000) = NULL,
    @Content         NVARCHAR(MAX)  = NULL,
    @ThumbnailImage  NVARCHAR(500)  = NULL,
    @Tags            NVARCHAR(500)  = NULL,
    @IsActive        BIT            = 0,
    @IsFeatured      BIT            = 0,
    @PublishedDate   DATETIME       = NULL,
    @Author          NVARCHAR(150)  = NULL,
    @MetaTitle       NVARCHAR(300)  = NULL,
    @MetaDescription NVARCHAR(500)  = NULL,
    @MetaKeywords    NVARCHAR(500)  = NULL,
    @ArticleStyle    NVARCHAR(MAX)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.BlogPosts
       SET Title           = @Title,
           Slug            = @Slug,
           Summary         = @Summary,
           Content         = @Content,
           ThumbnailImage  = @ThumbnailImage,
           Tags            = @Tags,
           IsActive        = @IsActive,
           IsFeatured      = @IsFeatured,
           PublishedDate   = @PublishedDate,
           Author          = @Author,
           MetaTitle       = @MetaTitle,
           MetaDescription = @MetaDescription,
           MetaKeywords    = @MetaKeywords,
           ArticleStyle    = @ArticleStyle,
           UpdatedDate     = GETDATE()
     WHERE Id = @Id;
END
GO

/* ----------------------------------------------------------------------------
   DeleteBlogPost  (به‌خاطر ON DELETE CASCADE، رکوردهای وابسته هم حذف می‌شوند)
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.DeleteBlogPost', N'P') IS NOT NULL DROP PROCEDURE dbo.DeleteBlogPost;
GO
CREATE PROCEDURE dbo.DeleteBlogPost
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.BlogPosts WHERE Id = @Id;
END
GO

/* ----------------------------------------------------------------------------
   ToggleBlogPostActive  / ToggleBlogPostFeatured
   (برای دکمه‌های فعال‌سازی و ویژه‌کردن در لیست)
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.ToggleBlogPostActive', N'P') IS NOT NULL DROP PROCEDURE dbo.ToggleBlogPostActive;
GO
CREATE PROCEDURE dbo.ToggleBlogPostActive
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.BlogPosts
       SET IsActive = CASE WHEN IsActive = 1 THEN 0 ELSE 1 END,
           UpdatedDate = GETDATE(),
           PublishedDate = CASE WHEN IsActive = 0 AND PublishedDate IS NULL THEN GETDATE() ELSE PublishedDate END
     WHERE Id = @Id;
END
GO

IF OBJECT_ID(N'dbo.ToggleBlogPostFeatured', N'P') IS NOT NULL DROP PROCEDURE dbo.ToggleBlogPostFeatured;
GO
CREATE PROCEDURE dbo.ToggleBlogPostFeatured
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.BlogPosts
       SET IsFeatured = CASE WHEN IsFeatured = 1 THEN 0 ELSE 1 END,
           UpdatedDate = GETDATE()
     WHERE Id = @Id;
END
GO

/* ----------------------------------------------------------------------------
   GetBlogPostById  -> 5 نتیجه برمی‌گرداند:
       (1) خود مقاله   (2) تصاویر   (3) ویدیوها   (4) فایل‌ها   (5) نسخه‌ها
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.GetBlogPostById', N'P') IS NOT NULL DROP PROCEDURE dbo.GetBlogPostById;
GO
CREATE PROCEDURE dbo.GetBlogPostById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM dbo.BlogPosts WHERE Id = @Id;

    SELECT * FROM dbo.BlogPostImages
     WHERE BlogPostId = @Id
     ORDER BY SortOrder ASC, Id ASC;

    SELECT * FROM dbo.BlogPostVideos
     WHERE BlogPostId = @Id
     ORDER BY SortOrder ASC, Id ASC;

    SELECT * FROM dbo.BlogPostAttachments
     WHERE BlogPostId = @Id
     ORDER BY Id DESC;

    SELECT * FROM dbo.BlogPostVersions
     WHERE BlogPostId = @Id
     ORDER BY VersionNumber DESC;
END
GO

/* ----------------------------------------------------------------------------
   IncrementBlogPostViewCount  (برای شمارش بازدید هنگام مشاهده)
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.IncrementBlogPostViewCount', N'P') IS NOT NULL DROP PROCEDURE dbo.IncrementBlogPostViewCount;
GO
CREATE PROCEDURE dbo.IncrementBlogPostViewCount
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.BlogPosts SET ViewCount = ViewCount + 1 WHERE Id = @Id;
END
GO

/* ----------------------------------------------------------------------------
   GetAllBlogPosts  ->  جستجو + فیلتر + مرتب‌سازی + صفحه‌بندی
       خروجی اول: ردیف‌های صفحهٔ جاری
       خروجی دوم: تعداد کل (برای صفحه‌بندی)
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.GetAllBlogPosts', N'P') IS NOT NULL DROP PROCEDURE dbo.GetAllBlogPosts;
GO
CREATE PROCEDURE dbo.GetAllBlogPosts
    @Search     NVARCHAR(300) = NULL,
    @IsActive   BIT           = NULL,   -- NULL = همه
    @IsFeatured BIT           = NULL,   -- NULL = همه
    @Author     NVARCHAR(150) = NULL,
    @SortColumn NVARCHAR(50)  = N'CreatedDate',
    @SortDir    NVARCHAR(4)   = N'DESC',
    @PageIndex  INT           = 1,      -- شروع از 1
    @PageSize   INT           = 10
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageIndex < 1 SET @PageIndex = 1;
    IF @PageSize  < 1 SET @PageSize  = 10;

    /* مجموعهٔ فیلترشده */
    ;WITH Filtered AS
    (
        SELECT
            Id, Title, Slug, Summary, ThumbnailImage, Tags, ViewCount,
            IsActive, IsFeatured, CreatedDate, UpdatedDate, PublishedDate, Author
        FROM dbo.BlogPosts
        WHERE (@Search IS NULL OR @Search = N''
                 OR Title LIKE N'%' + @Search + N'%'
                 OR Summary LIKE N'%' + @Search + N'%'
                 OR Tags LIKE N'%' + @Search + N'%'
                 OR Author LIKE N'%' + @Search + N'%')
          AND (@IsActive   IS NULL OR IsActive   = @IsActive)
          AND (@IsFeatured IS NULL OR IsFeatured = @IsFeatured)
          AND (@Author IS NULL OR @Author = N'' OR Author = @Author)
    )
    SELECT *
    FROM Filtered
    ORDER BY
        CASE WHEN @SortColumn = N'Title'         AND @SortDir = N'ASC'  THEN Title         END ASC,
        CASE WHEN @SortColumn = N'Title'         AND @SortDir = N'DESC' THEN Title         END DESC,
        CASE WHEN @SortColumn = N'ViewCount'     AND @SortDir = N'ASC'  THEN ViewCount     END ASC,
        CASE WHEN @SortColumn = N'ViewCount'     AND @SortDir = N'DESC' THEN ViewCount     END DESC,
        CASE WHEN @SortColumn = N'PublishedDate' AND @SortDir = N'ASC'  THEN PublishedDate END ASC,
        CASE WHEN @SortColumn = N'PublishedDate' AND @SortDir = N'DESC' THEN PublishedDate END DESC,
        CASE WHEN @SortColumn = N'CreatedDate'   AND @SortDir = N'ASC'  THEN CreatedDate   END ASC,
        /* پیش‌فرض: جدیدترین */
        CASE WHEN @SortColumn = N'CreatedDate'   AND @SortDir = N'DESC' THEN CreatedDate   END DESC,
        Id DESC
    OFFSET (@PageIndex - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    /* تعداد کل برای صفحه‌بندی */
    SELECT COUNT(*) AS TotalCount
    FROM dbo.BlogPosts
    WHERE (@Search IS NULL OR @Search = N''
             OR Title LIKE N'%' + @Search + N'%'
             OR Summary LIKE N'%' + @Search + N'%'
             OR Tags LIKE N'%' + @Search + N'%'
             OR Author LIKE N'%' + @Search + N'%')
      AND (@IsActive   IS NULL OR IsActive   = @IsActive)
      AND (@IsFeatured IS NULL OR IsFeatured = @IsFeatured)
      AND (@Author IS NULL OR @Author = N'' OR Author = @Author);
END
GO

/* ----------------------------------------------------------------------------
   تصاویر
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.InsertBlogPostImage', N'P') IS NOT NULL DROP PROCEDURE dbo.InsertBlogPostImage;
GO
CREATE PROCEDURE dbo.InsertBlogPostImage
    @BlogPostId INT,
    @ImageUrl   NVARCHAR(500),
    @AltText    NVARCHAR(300) = NULL,
    @Caption    NVARCHAR(500) = NULL,
    @SortOrder  INT           = 0,
    @IsFeatured BIT           = 0
AS
BEGIN
    SET NOCOUNT ON;

    /* اگر این تصویر شاخص است، شاخص بودن بقیه را بردار */
    IF @IsFeatured = 1
        UPDATE dbo.BlogPostImages SET IsFeatured = 0 WHERE BlogPostId = @BlogPostId;

    INSERT INTO dbo.BlogPostImages (BlogPostId, ImageUrl, AltText, Caption, SortOrder, IsFeatured, CreatedDate)
    VALUES (@BlogPostId, @ImageUrl, @AltText, @Caption, @SortOrder, @IsFeatured, GETDATE());

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewId;
END
GO

IF OBJECT_ID(N'dbo.DeleteBlogPostImage', N'P') IS NOT NULL DROP PROCEDURE dbo.DeleteBlogPostImage;
GO
CREATE PROCEDURE dbo.DeleteBlogPostImage
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.BlogPostImages WHERE Id = @Id;
END
GO

/* انتخاب تصویر شاخص */
IF OBJECT_ID(N'dbo.SetBlogPostFeaturedImage', N'P') IS NOT NULL DROP PROCEDURE dbo.SetBlogPostFeaturedImage;
GO
CREATE PROCEDURE dbo.SetBlogPostFeaturedImage
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @PostId INT, @Url NVARCHAR(500);
    SELECT @PostId = BlogPostId, @Url = ImageUrl FROM dbo.BlogPostImages WHERE Id = @Id;

    UPDATE dbo.BlogPostImages SET IsFeatured = 0 WHERE BlogPostId = @PostId;
    UPDATE dbo.BlogPostImages SET IsFeatured = 1 WHERE Id = @Id;

    /* تصویر شاخص گالری را به‌عنوان Thumbnail مقاله هم ست کن */
    UPDATE dbo.BlogPosts SET ThumbnailImage = @Url WHERE Id = @PostId;
END
GO

/* به‌روزرسانی ترتیب / متن جایگزین / کپشن یک تصویر (برای مرتب‌سازی و ویرایش) */
IF OBJECT_ID(N'dbo.UpdateBlogPostImage', N'P') IS NOT NULL DROP PROCEDURE dbo.UpdateBlogPostImage;
GO
CREATE PROCEDURE dbo.UpdateBlogPostImage
    @Id        INT,
    @AltText   NVARCHAR(300) = NULL,
    @Caption   NVARCHAR(500) = NULL,
    @SortOrder INT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.BlogPostImages
       SET AltText = @AltText, Caption = @Caption, SortOrder = @SortOrder
     WHERE Id = @Id;
END
GO

/* ----------------------------------------------------------------------------
   ویدیوها
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.InsertBlogPostVideo', N'P') IS NOT NULL DROP PROCEDURE dbo.InsertBlogPostVideo;
GO
CREATE PROCEDURE dbo.InsertBlogPostVideo
    @BlogPostId   INT,
    @VideoUrl     NVARCHAR(700),
    @ThumbnailUrl NVARCHAR(500)  = NULL,
    @Title        NVARCHAR(300)  = NULL,
    @Description  NVARCHAR(1000) = NULL,
    @SortOrder    INT            = 0
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.BlogPostVideos (BlogPostId, VideoUrl, ThumbnailUrl, Title, Description, SortOrder, CreatedDate)
    VALUES (@BlogPostId, @VideoUrl, @ThumbnailUrl, @Title, @Description, @SortOrder, GETDATE());

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewId;
END
GO

IF OBJECT_ID(N'dbo.DeleteBlogPostVideo', N'P') IS NOT NULL DROP PROCEDURE dbo.DeleteBlogPostVideo;
GO
CREATE PROCEDURE dbo.DeleteBlogPostVideo
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.BlogPostVideos WHERE Id = @Id;
END
GO

/* ----------------------------------------------------------------------------
   فایل‌های ضمیمه
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.InsertBlogPostAttachment', N'P') IS NOT NULL DROP PROCEDURE dbo.InsertBlogPostAttachment;
GO
CREATE PROCEDURE dbo.InsertBlogPostAttachment
    @BlogPostId INT,
    @FileName   NVARCHAR(300),
    @FileUrl    NVARCHAR(500),
    @FileSize   BIGINT        = NULL,
    @FileType   NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.BlogPostAttachments (BlogPostId, FileName, FileUrl, FileSize, FileType, CreatedDate)
    VALUES (@BlogPostId, @FileName, @FileUrl, @FileSize, @FileType, GETDATE());

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewId;
END
GO

IF OBJECT_ID(N'dbo.DeleteBlogPostAttachment', N'P') IS NOT NULL DROP PROCEDURE dbo.DeleteBlogPostAttachment;
GO
CREATE PROCEDURE dbo.DeleteBlogPostAttachment
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.BlogPostAttachments WHERE Id = @Id;
END
GO

/* ----------------------------------------------------------------------------
   نسخه‌ها
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.InsertBlogPostVersion', N'P') IS NOT NULL DROP PROCEDURE dbo.InsertBlogPostVersion;
GO
CREATE PROCEDURE dbo.InsertBlogPostVersion
    @BlogPostId INT,
    @Title      NVARCHAR(300) = NULL,
    @Content    NVARCHAR(MAX) = NULL,
    @ModifiedBy NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Next INT;
    SELECT @Next = ISNULL(MAX(VersionNumber), 0) + 1
      FROM dbo.BlogPostVersions WHERE BlogPostId = @BlogPostId;

    INSERT INTO dbo.BlogPostVersions (BlogPostId, Title, Content, ModifiedBy, ModifiedDate, VersionNumber)
    VALUES (@BlogPostId, @Title, @Content, @ModifiedBy, GETDATE(), @Next);

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewId, @Next AS VersionNumber;
END
GO

/* ----------------------------------------------------------------------------
   RestoreBlogPostVersion
   محتوای نسخهٔ انتخابی را به مقالهٔ اصلی برمی‌گرداند
   (قبل از بازگردانی، وضعیت فعلی را به‌عنوان یک نسخهٔ جدید ذخیره می‌کند)
   ---------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.RestoreBlogPostVersion', N'P') IS NOT NULL DROP PROCEDURE dbo.RestoreBlogPostVersion;
GO
CREATE PROCEDURE dbo.RestoreBlogPostVersion
    @VersionId  INT,
    @ModifiedBy NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @PostId INT, @vTitle NVARCHAR(300), @vContent NVARCHAR(MAX);
    SELECT @PostId = BlogPostId, @vTitle = Title, @vContent = Content
      FROM dbo.BlogPostVersions WHERE Id = @VersionId;

    IF @PostId IS NULL RETURN;

    /* بکاپ وضعیت فعلی قبل از بازگردانی */
    DECLARE @Next INT;
    SELECT @Next = ISNULL(MAX(VersionNumber), 0) + 1
      FROM dbo.BlogPostVersions WHERE BlogPostId = @PostId;

    INSERT INTO dbo.BlogPostVersions (BlogPostId, Title, Content, ModifiedBy, ModifiedDate, VersionNumber)
    SELECT Id, Title, Content, @ModifiedBy, GETDATE(), @Next
      FROM dbo.BlogPosts WHERE Id = @PostId;

    /* بازگردانی */
    UPDATE dbo.BlogPosts
       SET Title = @vTitle, Content = @vContent, UpdatedDate = GETDATE()
     WHERE Id = @PostId;

    SELECT @PostId AS BlogPostId;
END
GO


/* ############################################################################
   #                 نمونه دستورات INSERT / UPDATE / DELETE / SELECT          #
   ############################################################################ */

/* --- INSERT نمونه --- */
-- EXEC dbo.InsertBlogPost
--      @Title = N'اولین مقاله فروشگاه',
--      @Slug  = N'first-article',
--      @Summary = N'خلاصه‌ای کوتاه از مقاله',
--      @Content = N'<h2>سرفصل</h2><p>متن مقاله ...</p>',
--      @Tags = N'فروشگاه,آموزش',
--      @IsActive = 1, @IsFeatured = 0,
--      @PublishedDate = NULL, @Author = N'مدیر سایت',
--      @MetaTitle = N'اولین مقاله', @MetaDescription = N'توضیح متا', @MetaKeywords = N'کلیدواژه';

/* --- SELECT مستقیم (بدون SP) --- */
-- SELECT TOP 10 Id, Title, Slug, ViewCount, IsActive, IsFeatured, CreatedDate
--   FROM dbo.BlogPosts
--  ORDER BY CreatedDate DESC;

/* --- UPDATE مستقیم (مثال: فعال‌سازی) --- */
-- UPDATE dbo.BlogPosts SET IsActive = 1, PublishedDate = GETDATE() WHERE Id = 1;

/* --- DELETE مستقیم (رکوردهای وابسته با CASCADE حذف می‌شوند) --- */
-- DELETE FROM dbo.BlogPosts WHERE Id = 1;

PRINT N'BlogModule schema & stored procedures installed successfully.';
GO
