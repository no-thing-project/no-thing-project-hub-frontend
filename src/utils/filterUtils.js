export const filterEntities = (items, type, quickFilter, searchQuery, gates = [], classes = []) => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return items
      .map((item) => {
        if (type === 'classes') {
          const gate = gates.find((g) => g.gate_id === item.gate_id);
          return { ...item, gateName: gate?.name || 'No Gate' };
        }
        if (type === 'boards') {
          const gate = gates.find((g) => g.gate_id === item.gate_id);
          const cls = classes.find((c) => c.class_id === item.class_id);
          return {
            ...item,
            gateName: gate?.name || 'No Gate',
            className: cls?.name || 'No Class',
          };
        }
        return item;
      })
      .filter((item) => {
        const matchesSearch =
          (item.name || '').toLowerCase().includes(lowerSearchQuery) ||
          (item.description || '').toLowerCase().includes(lowerSearchQuery) ||
          (item.gateName || '').toLowerCase().includes(lowerSearchQuery) ||
          (item.className || '').toLowerCase().includes(lowerSearchQuery) ||
          (item.tags || []).some((tag) => tag.toLowerCase().includes(lowerSearchQuery));
        if (!matchesSearch) return false;
  
        switch (quickFilter) {
          case 'public':
            return item.is_public || item.access?.is_public || item.visibility === 'public';
          case 'private':
            return !(item.is_public || item.access?.is_public) || item.visibility === 'private';
          case 'favorited':
            return item.is_favorited;
          case 'group':
            return item.type === 'group';
          case 'personal':
            return item.type === 'personal';
          case 'community':
            return item.type === 'community';
          case 'organization':
            return item.type === 'organization';
          case 'gates':
            return !!item.gate_id;
          case 'classes':
            return !!item.class_id;
          default:
            return true;
        }
      });
  };