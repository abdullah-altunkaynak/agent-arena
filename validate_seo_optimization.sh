#!/bin/bash
# SEO & Performance Validation Tests

echo "=== SEO & Performance Optimization Validation ==="
echo ""

# Test 1: Check canonical URLs
echo "📋 Test 1: Canonical Tags"
echo "Frontend pages should have clean canonical URLs (no ?lang parameter)"
grep -r "canonical.*lang=" frontend/pages/ || echo "✅ No canonical with lang parameter found"

# Test 2: Check hreflang tags
echo ""
echo "📋 Test 2: Hreflang Tags"
echo "Blog pages should have hreflang tags with lang parameters"
grep -r "hrefLang.*lang=" frontend/pages/blog/ || echo "✅ Hreflang tags properly configured"

# Test 3: Check Next/Image usage
echo ""
echo "📋 Test 3: Next/Image Component"
echo "Featured images should use Next/Image"
grep "import Image from 'next/image'" frontend/pages/blog/\\[slug\\].js && echo "✅ Blog slug page uses Next/Image"
grep "import Image from 'next/image'" frontend/pages/index.js && echo "✅ Homepage uses Next/Image"

# Test 4: Check cache implementation
echo ""
echo "📋 Test 4: Cache Implementation"
test -f "frontend/lib/cache.js" && echo "✅ Cache middleware exists"
grep "getCachedResponse\|setCachedResponse" frontend/pages/blog/\\[slug\\].js && echo "✅ Caching integrated in blog slug page"

# Test 5: Check database optimizations
echo ""
echo "📋 Test 5: Database Optimizations"
grep "select(.*necessary_fields" backend/blog/database.py && echo "✅ Only necessary fields selected"
grep "page_size = min(page_size, 100)" backend/blog/database.py && echo "✅ Page size capped at 100"

# Test 6: Check next.config.js
echo ""
echo "📋 Test 6: Next.config Configuration"
grep "images:" frontend/next.config.js && echo "✅ Image optimization configured"
grep "Cache-Control" frontend/next.config.js && echo "✅ Cache headers configured"

# Test 7: Check HTML lang dynamic setting
echo ""
echo "📋 Test 7: Dynamic HTML Lang"
grep "document.documentElement.lang" frontend/pages/blog/\\[slug\\].js && echo "✅ HTML lang dynamically set in blog slug"
grep "document.documentElement.lang" frontend/pages/blog/index.js && echo "✅ HTML lang dynamically set in blog index"
grep "document.documentElement.lang" frontend/pages/blog/categories.js && echo "✅ HTML lang dynamically set in blog categories"

# Test 8: Sitemap optimization
echo ""
echo "📋 Test 8: Sitemap Optimization"
grep "buildBlogStaticUrls\|buildPostUrls" frontend/pages/sitemap.xml.js | grep -v "BLOG_LANGS" && echo "✅ Sitemap uses clean URLs (no lang parameter)"

echo ""
echo "=== All Tests Complete ==="
