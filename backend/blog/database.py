"""
Blog Database Service
Supabase database operations for blog posts
"""

import os
import random
import re
import unicodedata
from typing import Optional, List, Dict
from datetime import datetime
from logging import getLogger
from dotenv import load_dotenv

from supabase import create_client, Client
from .models import PostCreate, PostUpdate, PostResponse, PostStatus

# Load environment variables
load_dotenv()

logger = getLogger(__name__)

DEFAULT_CATEGORY_ICONS = [
    "🧠", "⚙️", "🚀", "📊", "🔬", "💡", "🛠️", "🌐", "📈", "🤖"
]


def _slugify_text(value: str) -> str:
    """Create a URL-safe slug from unicode text."""
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    lowered = ascii_text.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
    return slug or "kategori"


class BlogDatabaseService:
    """Service for handling blog database operations via Supabase"""

    def __init__(self):
        """Initialize Supabase client"""
        self.supabase_url = os.getenv("SUPABASE_URL")
        # Use service role key for backend operations
        self.supabase_key = (
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or os.getenv("SUPABASE_KEY")
            or os.getenv("SUPABASE_ANON_KEY")
        )
        self.blog_images_bucket = os.getenv("SUPABASE_BLOG_IMAGES_BUCKET", "blog-images")

        if not self.supabase_url or not self.supabase_key:
            logger.warning(
                "Supabase credentials not configured. "
                "Set SUPABASE_URL and one of SUPABASE_SERVICE_ROLE_KEY, SUPABASE_KEY, or SUPABASE_ANON_KEY env variables."
            )
            self.client: Optional[Client] = None
        else:
            self.client = create_client(self.supabase_url, self.supabase_key)
            logger.info("Supabase client initialized successfully")

    def _check_connection(self):
        """Check if Supabase client is properly initialized"""
        if not self.client:
            raise RuntimeError(
                "Supabase client not initialized. "
                "Ensure SUPABASE_URL and one of SUPABASE_SERVICE_ROLE_KEY, SUPABASE_KEY, or SUPABASE_ANON_KEY are set."
            )

    async def create_post(self, post_data: PostCreate) -> PostResponse:
        """
        Create a new blog post

        Args:
            post_data: PostCreate model with post details

        Returns:
            PostResponse: Created post data
        """
        self._check_connection()

        payload = {
            "title_tr": post_data.title_tr,
            "content_tr": post_data.content_tr,
            "title_en": post_data.title_en,
            "content_en": post_data.content_en,
            "slug": post_data.slug,
            "status": post_data.status.value,
            "category_id": post_data.category_id,
            "excerpt_tr": post_data.excerpt_tr,
            "excerpt_en": post_data.excerpt_en,
            "featured_image_url": post_data.featured_image_url,
        }

        response = self.client.table("posts").insert(payload).execute()

        if response.data:
            logger.info(f"Post created successfully: {response.data[0]['id']}")
            return PostResponse(**response.data[0])
        else:
            raise Exception("Failed to create post in database")

    async def get_post_by_id(self, post_id: str) -> Optional[PostResponse]:
        """
        Retrieve a post by ID

        Args:
            post_id: UUID of the post

        Returns:
            PostResponse or None if not found
        """
        self._check_connection()

        response = self.client.table("posts").select("*").eq("id", post_id).execute()

        if response.data:
            return PostResponse(**response.data[0])
        return None

    async def get_post_by_slug(self, slug: str) -> Optional[PostResponse]:
        """
        Retrieve a post by slug

        Args:
            slug: URL slug of the post

        Returns:
            PostResponse or None if not found
        """
        self._check_connection()

        response = self.client.table("posts").select("*").eq("slug", slug).execute()

        if response.data:
            return PostResponse(**response.data[0])
        return None

    async def get_slug_redirect_target(self, old_slug: str) -> Optional[str]:
        """Resolve legacy slug to current slug from redirect table."""
        self._check_connection()

        try:
            response = (
                self.client.table("post_slug_redirects")
                .select("new_slug")
                .eq("old_slug", (old_slug or "").strip().lower())
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )

            if response.data:
                return response.data[0].get("new_slug")
            return None
        except Exception as e:
            # Keep compatibility if the table is not migrated yet.
            logger.warning(f"Slug redirect lookup unavailable: {str(e)}")
            return None

    async def record_slug_redirect(self, post_id: str, old_slug: str, new_slug: str) -> None:
        """Persist a legacy-to-current slug mapping."""
        self._check_connection()

        normalized_old = (old_slug or "").strip().lower()
        normalized_new = (new_slug or "").strip().lower()
        if not normalized_old or not normalized_new or normalized_old == normalized_new:
            return

        try:
            existing = (
                self.client.table("post_slug_redirects")
                .select("id")
                .eq("old_slug", normalized_old)
                .limit(1)
                .execute()
            )

            if existing.data:
                self.client.table("post_slug_redirects").update(
                    {"new_slug": normalized_new, "post_id": post_id}
                ).eq("old_slug", normalized_old).execute()
            else:
                self.client.table("post_slug_redirects").insert(
                    {
                        "post_id": post_id,
                        "old_slug": normalized_old,
                        "new_slug": normalized_new,
                    }
                ).execute()
        except Exception as e:
            # Keep post updates working even if redirects table migration is pending.
            logger.warning(f"Slug redirect write skipped: {str(e)}")

    async def get_all_posts(
        self,
        status: Optional[PostStatus] = None,
        category_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Dict:
        """
        Retrieve paginated list of posts

        Args:
            status: Filter by status (optional)
            page: Page number (1-indexed)
            page_size: Number of posts per page

        Returns:
            Dict with posts and pagination info
        """
        self._check_connection()

        query = self.client.table("posts").select("*")

        # Apply status filter if provided
        if status:
            query = query.eq("status", status.value)

        # Apply category filter if provided
        if category_id:
            query = query.eq("category_id", category_id)

        # Get total count
        count_response = query.execute()
        total = len(count_response.data)

        # Calculate offset
        offset = (page - 1) * page_size

        # Apply ordering and pagination
        response = (
            query.order("created_at", desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )

        posts = [PostResponse(**item) for item in response.data]
        total_pages = (total + page_size - 1) // page_size

        return {
            "items": posts,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    async def update_post(self, post_id: str, post_data: PostUpdate) -> PostResponse:
        """
        Update a blog post

        Args:
            post_id: UUID of the post
            post_data: PostUpdate model with new data

        Returns:
            PostResponse: Updated post data
        """
        self._check_connection()

        existing_post = await self.get_post_by_id(post_id)
        if not existing_post:
            raise Exception(f"Post not found: {post_id}")

        # Build update payload (only include non-None values)
        payload = {}
        for field, value in post_data.dict(exclude_unset=True).items():
            if value is not None:
                if isinstance(value, PostStatus):
                    payload[field] = value.value
                else:
                    payload[field] = value

        # If status is being changed to published, set published_at
        if "status" in payload and payload["status"] == "published":
            payload["published_at"] = datetime.utcnow().isoformat()

        response = (
            self.client.table("posts")
            .update(payload)
            .eq("id", post_id)
            .execute()
        )

        if response.data:
            if "slug" in payload:
                await self.record_slug_redirect(
                    post_id=post_id,
                    old_slug=existing_post.slug,
                    new_slug=payload["slug"],
                )
            logger.info(f"Post updated successfully: {post_id}")
            return PostResponse(**response.data[0])
        else:
            raise Exception(f"Failed to update post: {post_id}")

    async def delete_post(self, post_id: str) -> bool:
        """
        Delete a blog post

        Args:
            post_id: UUID of the post

        Returns:
            bool: True if deletion successful
        """
        self._check_connection()

        response = self.client.table("posts").delete().eq("id", post_id).execute()

        if response:
            logger.info(f"Post deleted successfully: {post_id}")
            return True
        else:
            raise Exception(f"Failed to delete post: {post_id}")

    async def publish_post(self, post_id: str) -> PostResponse:
        """
        Publish a draft post

        Args:
            post_id: UUID of the post

        Returns:
            PostResponse: Updated post data
        """
        update_data = PostUpdate(
            status=PostStatus.PUBLISHED,
        )
        return await self.update_post(post_id, update_data)

    async def search_posts(self, query: str) -> List[PostResponse]:
        """
        Search posts by title or content

        Args:
            query: Search query string

        Returns:
            List of matching posts
        """
        self._check_connection()

        # Supabase full-text search - searches both Turkish and English titles/content
        response = (
            self.client.table("posts")
            .select("*")
            .or_(
                f"title_tr.ilike.%{query}%,content_tr.ilike.%{query}%,"
                f"title_en.ilike.%{query}%,content_en.ilike.%{query}%"
            )
            .eq("status", "published")
            .execute()
        )

        return [PostResponse(**item) for item in response.data]

    async def increment_view_count(self, post_id: str) -> int:
        """
        Increment view count for a post

        Args:
            post_id: UUID of the post

        Returns:
            Updated view count
        """
        self._check_connection()

        # Get current count
        post = await self.get_post_by_id(post_id)
        if not post:
            raise ValueError(f"Post not found: {post_id}")

        new_count = post.view_count + 1

        response = (
            self.client.table("posts")
            .update({"view_count": new_count})
            .eq("id", post_id)
            .execute()
        )

        if response.data:
            return response.data[0]["view_count"]
        else:
            raise Exception(f"Failed to update view count: {post_id}")

    async def get_categories(self) -> List[Dict]:
        """Get all categories"""
        self._check_connection()
        try:
            response = self.client.table("categories").select("*").execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error fetching categories: {str(e)}")
            return []

    async def get_category_id_by_name_tr(self, name_tr: str) -> Optional[str]:
        """Resolve category UUID by Turkish category name."""
        self._check_connection()
        if not name_tr:
            return None

        target = name_tr.strip().casefold()
        if not target:
            return None

        try:
            response = self.client.table("categories").select("id,name_tr").execute()
            rows = response.data or []
            for row in rows:
                value = (row.get("name_tr") or "").strip().casefold()
                if value == target:
                    return row.get("id")
            return None
        except Exception as e:
            logger.error(f"Error resolving category by name_tr: {str(e)}")
            return None

    async def get_or_create_category_id_by_name_tr(self, name_tr: str) -> Optional[str]:
        """Resolve category UUID by name_tr, create category if it does not exist."""
        self._check_connection()

        normalized_name = (name_tr or "").strip()
        if not normalized_name:
            return None

        existing_id = await self.get_category_id_by_name_tr(normalized_name)
        if existing_id:
            return existing_id

        try:
            existing_rows = self.client.table("categories").select("slug").execute().data or []
            existing_slugs = {((row.get("slug") or "").strip().lower()) for row in existing_rows}

            base_slug = _slugify_text(normalized_name)
            candidate_slug = base_slug
            suffix = 2
            while candidate_slug in existing_slugs:
                candidate_slug = f"{base_slug}-{suffix}"
                suffix += 1

            icon = random.choice(DEFAULT_CATEGORY_ICONS)
            payload = {
                "name_tr": normalized_name,
                "name_en": normalized_name,
                "slug": candidate_slug,
                "description_tr": f"{normalized_name} kategorisindeki yazılar",
                "description_en": f"Articles in {normalized_name} category",
                "icon": icon,
            }

            response = self.client.table("categories").insert(payload).execute()
            if response.data:
                created_id = response.data[0].get("id")
                logger.info(
                    f"Category auto-created from n8n payload: name_tr='{normalized_name}', id='{created_id}', slug='{candidate_slug}'"
                )
                return created_id

            return None
        except Exception as e:
            logger.error(f"Error creating category by name_tr: {str(e)}")
            return None

    async def create_category(self, category_data) -> Dict:
        """Create a new category"""
        self._check_connection()
        try:
            response = (
                self.client.table("categories")
                .insert({
                    "name": category_data.name,
                    "slug": category_data.slug,
                    "description": category_data.description or "",
                })
                .execute()
            )
            if response.data:
                return response.data[0]
            else:
                raise Exception("Failed to create category")
        except Exception as e:
            logger.error(f"Error creating category: {str(e)}")
            raise

    async def delete_category(self, category_id: str) -> bool:
        """Delete a category"""
        self._check_connection()
        try:
            response = (
                self.client.table("categories")
                .delete()
                .eq("id", category_id)
                .execute()
            )
            return True
        except Exception as e:
            logger.error(f"Error deleting category: {str(e)}")
            raise

    async def upload_image(self, upload_file) -> str:
        """
        Upload an image to Supabase storage

        Args:
            upload_file: FastAPI UploadFile object

        Returns:
            str: Public URL of the uploaded image
        """
        self._check_connection()
        try:
            import uuid

            # Generate unique filename
            file_ext = os.path.splitext(upload_file.filename)[1]
            if not file_ext:
                file_ext = ".jpg"
            unique_name = f"blog_{''.join(str(uuid.uuid4()).split('-'))[:12]}{file_ext}"

            # Read file content
            contents = await upload_file.read()

            # Upload to Supabase storage
            path = f"blog_images/{unique_name}"
            content_type = upload_file.content_type or "application/octet-stream"

            try:
                self.client.storage.from_(self.blog_images_bucket).upload(
                    path=path,
                    file=contents,
                    file_options={"content-type": content_type},
                )
            except Exception as upload_err:
                err_text = str(upload_err)
                # If bucket does not exist yet, create it and retry once.
                if "Bucket not found" in err_text or "404" in err_text:
                    logger.warning(
                        f"Storage bucket '{self.blog_images_bucket}' not found. Attempting to create it."
                    )
                    self._ensure_images_bucket_exists()
                    self.client.storage.from_(self.blog_images_bucket).upload(
                        path=path,
                        file=contents,
                        file_options={"content-type": content_type},
                    )
                else:
                    raise

            # Get public URL
            public_url = self.client.storage.from_(self.blog_images_bucket).get_public_url(path)
            logger.info(f"Image uploaded successfully: {public_url}")
            return public_url

        except Exception as e:
            logger.error(f"Error uploading image: {str(e)}")
            raise Exception(f"Failed to upload image: {str(e)}")

    def _ensure_images_bucket_exists(self) -> None:
        """Create the blog images bucket if it does not exist."""
        self._check_connection()
        try:
            # Newer supabase-py versions
            self.client.storage.create_bucket(
                self.blog_images_bucket,
                options={"public": True},
            )
            logger.info(f"Created storage bucket: {self.blog_images_bucket}")
            return
        except TypeError:
            # Older supabase-py versions may accept a different signature.
            self.client.storage.create_bucket(self.blog_images_bucket, {"public": True})
            logger.info(f"Created storage bucket: {self.blog_images_bucket}")
            return
        except Exception as e:
            # If another request created the bucket concurrently, continue.
            err_text = str(e).lower()
            if "already exists" in err_text or "duplicate" in err_text or "409" in err_text:
                logger.info(f"Storage bucket already exists: {self.blog_images_bucket}")
                return
            raise


# Singleton instance
_blog_service: Optional[BlogDatabaseService] = None


def get_blog_service() -> BlogDatabaseService:
    """Get or create blog database service instance"""
    global _blog_service
    if _blog_service is None:
        _blog_service = BlogDatabaseService()
    return _blog_service
