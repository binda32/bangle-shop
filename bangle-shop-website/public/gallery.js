fetch('/api/bangles')
  .then(res => res.json())
  .then(data => {
    data.forEach(item => {
      const cat = item.category.toLowerCase();
      const container = document.querySelector(`.gallery[data-category="${item.category}"]`);
      if (!container) return;
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <img src="${item.imageUrl}" alt="${item.category} Bangle" />
        <p>₹${item.price}</p>`;
      container.appendChild(div);
    });
  });
