import { Link } from 'react-router';

export default function BlogCard({ post }) {
  const dateStr = post.date || post.created_at;
  const date = dateStr ? new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block rounded-xl border border-border bg-surface p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary-light">
          {post.category}
        </span>
        {date && (
          <span className="text-xs text-text-muted">{date}</span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-text group-hover:text-primary-light transition-colors mb-1.5">
        {post.title}
      </h3>
      <p className="text-sm text-text-muted line-clamp-2 mb-3">
        {post.excerpt}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-surface-alt text-text-muted">
            #{tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
