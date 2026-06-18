/**
 * Generates an SEO-friendly slug from a string.
 * Replaces spaces with hyphens, removes special characters,
 * and strips Vietnamese diacritics.
 * 
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
    if (!text) return '';
    let slug = text.toString().toLowerCase().trim();

    // Map Vietnamese diacritics to basic letters
    slug = slug.replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a');
    slug = slug.replace(/[éèẻẽẹêếềểễệ]/g, 'e');
    slug = slug.replace(/[íìỉĩị]/g, 'i');
    slug = slug.replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o');
    slug = slug.replace(/[úùủũụưứừửữự]/g, 'u');
    slug = slug.replace(/[ýỳỷỹỵ]/g, 'y');
    slug = slug.replace(/đ/g, 'd');
    slug = slug.replace(/đ/g, 'd'); // Duplicate safeguard

    // Replace non-alphanumeric characters with spaces (keeps letters, numbers, spaces, and hyphens)
    slug = slug.replace(/[^a-z0-9\s-]/g, '');

    // Replace multiple spaces or hyphens with a single hyphen
    slug = slug.replace(/[\s-]+/g, '-');

    // Trim leading/trailing hyphens
    slug = slug.replace(/^-+|-+$/g, '');

    return slug;
}

module.exports = slugify;
