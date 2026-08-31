import connectToDatabase from './mongodb';
import Menu from '@/models/Menu';

function normalizeMenuItems(items = []) {
  return items.map((item) => ({
    id: item.id || item._id?.toString() || `${item.text || 'menu'}-${item.href || '/'}`,
    text: item.text || '',
    href: item.href || '/',
    target: item.target || '_self',
    children: normalizeMenuItems(item.children || []),
  }));
}

export async function getMenuItems(type) {
  try {
    await connectToDatabase();
    const menu = await Menu.findOne({ type }).select('items').lean();
    return normalizeMenuItems(menu?.items || []);
  } catch (error) {
    console.error(`Error fetching ${type} menu:`, error);
    return [];
  }
}
