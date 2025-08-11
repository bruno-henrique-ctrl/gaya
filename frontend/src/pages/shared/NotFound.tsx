import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div style={{ textAlign: "center", marginTop: 100 }}>
            <h1>404 - Página não encontrada</h1>
            <p>A página que você tentou acessar não existe.</p>
            <Link to="/">Voltar para a página inicial</Link>
        </div>
    );
}

export default NotFound