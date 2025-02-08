export default function Sidebar({ setCurrentPage, isAdmin }) {
  return (
    <div className="w-64 bg-gray-900 p-4">
      <nav>
        <ul>
          <li>
            <button
              onClick={() => setCurrentPage("public-chat")}
              className="w-full text-left p-2 hover:bg-gray-800 rounded"
            >
              Öffentlicher Chat
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage("private-chat")}
              className="w-full text-left p-2 hover:bg-gray-800 rounded"
            >
              Privater Chat
            </button>
          </li>
          <li>
            <button onClick={() => setCurrentPage("market")} className="w-full text-left p-2 hover:bg-gray-800 rounded">
              Market
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage("other-shops")}
              className="w-full text-left p-2 hover:bg-gray-800 rounded"
            >
              Andere Shops
            </button>
          </li>
          {isAdmin && (
            <>
              <li>
                <button
                  onClick={() => setCurrentPage("admin")}
                  className="w-full text-left p-2 hover:bg-gray-800 rounded"
                >
                  Admin Panel
                </button>
              </li>
            </>
          )}
          <li>
            <button onClick={() => setCurrentPage("logout")} className="w-full text-left p-2 hover:bg-gray-800 rounded">
              Abmelden
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}

