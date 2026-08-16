export default function Header() {
  return (
    <header className="app-header">
      <nav className="navbar navbar-expand tetris-header">
        <div className="container">
          <span className="navbar-brand tetris-brand">
            <span className="brand-blocks" aria-hidden="true">
              <i className="b b1" />
              <i className="b b2" />
              <i className="b b3" />
              <i className="b b4" />
            </span>
            tvimogame
          </span>
          <span className="navbar-text tetris-nav-text d-none d-sm-inline">
            Tetris
          </span>
        </div>
      </nav>
    </header>
  )
}
