// Carregar o HTML da sidebar dinamicamente
fetch('./sidebar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('sidebar-container').innerHTML = html;

    // Seleciona os elementos necessários
    const sidebar = document.getElementById("sidebar");
    const content = document.getElementById("main-content");
    
    // Verifica o estado salvo ao carregar a página
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
      sidebar.classList.add("collapsed");
      document.body.classList.add('sidebar-collapsed');
    }

    // Evento para alternar a sidebar
    document.getElementById("toggleSidebar").addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      document.body.classList.toggle('sidebar-collapsed');
      
      // Atualiza o localStorage para manter o estado
      const isNowCollapsed = sidebar.classList.contains("collapsed");
      localStorage.setItem('sidebarCollapsed', isNowCollapsed);
    });

    // Evento para o botão de logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('loggedUser'); 
      window.location.href = '../login.html';
    });
  });