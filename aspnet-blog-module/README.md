# ماژول مدیریت مقالات (CMS) — ASP.NET Web Forms (.NET Framework 4.6)

این ماژول دقیقاً بر اساس `Admin.master` شما طراحی شده و تمام محتوا داخل
ContentPlaceHolderهای همان MasterPage قرار گرفته است
(`TitleContent`, `PageTitle`, `PageDescription`, `MainContent`).

## فایل‌ها

| فایل | توضیح |
|------|-------|
| `Admin/BlogPosts.aspx` | رابط کاربری (لیست + فرم) — وابسته به `~/Admin/Admin.master` |
| `Admin/BlogPosts.aspx.cs` | منطق صفحه با ADO.NET و Stored Procedureها (بدون لایه‌بندی) |
| `SQL/BlogModule.sql` | کل جداول، ایندکس‌ها، FKها و تمام Stored Procedureها |

## نصب — ۴ گام

### ۱) دیتابیس
کل فایل `SQL/BlogModule.sql` را روی دیتابیس فروشگاه اجرا کنید
(جداول و Stored Procedureها ساخته می‌شوند؛ اسکریپت idempotent است).

### ۲) قرار دادن فایل‌ها
دو فایل `BlogPosts.aspx` و `BlogPosts.aspx.cs` را در پوشهٔ `Admin/` پروژه
(کنار `Admin.master`) کپی کنید.

### ۳) رشتهٔ اتصال
در `BlogPosts.aspx.cs` ثابت زیر را با نام رشتهٔ اتصال پروژهٔ خودتان مطابقت دهید:

```csharp
private const string ConnName = "ShopDB";
```

این نام باید با رشتهٔ اتصال موجود در `web.config` شما یکی باشد (نمونهٔ پروژهٔ شما):

```xml
<connectionStrings>
  <add name="ShopDB"
       connectionString="Data Source=DESKTOP-1FOG3JP\SQLEXPRESS;Initial Catalog=MYSHOP;Integrated Security=True;Pooling=False;Connect Timeout=30"
       providerName="System.Data.SqlClient" />
</connectionStrings>
```

### ۴) پوشهٔ آپلود و حجم مجاز
پوشهٔ `Uploads/Blog/` در ریشهٔ سایت به‌صورت خودکار ساخته می‌شود، اما باید
مجوز نوشتن برای IIS داشته باشد. برای آپلود فایل‌های بزرگ، در `web.config`:

```xml
<system.web>
  <!-- حداکثر ۵۰ مگابایت -->
  <httpRuntime maxRequestLength="51200" executionTimeout="300" targetFramework="4.6" />
</system.web>
<system.webServer>
  <security>
    <requestFiltering>
      <requestLimits maxAllowedContentLength="52428800" />
    </requestFiltering>
  </security>
</system.webServer>
```

### (اختیاری) افزودن به منوی سایدبار
در `Admin.master` یک آیتم منو اضافه کنید:

```html
<li id="liBlog" runat="server"><a href="BlogPosts.aspx"><i class="fas fa-newspaper"></i><span>مقالات</span></a></li>
```

## نکات فنی

- **ادیتور متن، کاملاً آفلاین و بدون هیچ CDN** پیاده‌سازی شده (با `contenteditable`
  و `document.execCommand`). امکانات: H1–H6، Bold/Italic/Underline/Strike، لیست،
  چیدمان، لینک، تصویر (Base64 بدون نیاز به سرور)، ویدیو (آپارات/یوتیوب به‌صورت
  iframe)، جدول، نقل‌قول، کد، رنگ متن، نمایش/ویرایش کد HTML و تمام‌صفحه.
  چون به اینترنت یا CDN وابسته نیست، در شبکه‌های فیلترشده هم کار می‌کند.
- شمارش کلمات و زمان مطالعه به‌صورت زنده از متن ادیتور محاسبه می‌شود.
- تولید Slug هم در سمت کلاینت (هنگام تایپ) و هم سمت سرور (هنگام ذخیره) انجام می‌شود.
- مدیریت تصاویر/ویدیوها/فایل‌ها و نسخه‌ها **پس از اولین ذخیرهٔ مقاله** فعال می‌شود
  (چون به `BlogPostId` نیاز دارند).
- هر بار ویرایش و ذخیره، نسخهٔ قبلی به‌صورت خودکار در `BlogPostVersions` ثبت می‌شود.
- حذف مقاله به‌خاطر `ON DELETE CASCADE`، تصاویر/ویدیوها/فایل‌ها/نسخه‌های آن را هم حذف می‌کند.
- صفحه‌بندی، جستجو، فیلتر و مرتب‌سازی همگی **سمت دیتابیس** (در `GetAllBlogPosts`) انجام می‌شوند.

> توجه: این ریپازیتوری یک پروژهٔ React/Node است؛ این فایل‌ها مستقل و آمادهٔ کپی
> در پروژهٔ ASP.NET Web Forms شما تولید شده‌اند و بخشی از build این ریپو نیستند.
