import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Shield,
  User
} from "lucide-react";

const STORAGE_KEY = "satudata_admin_accounts";

export default function UserPage() {

  const [users,setUsers] = useState([]);
  const [keyword,setKeyword] = useState("");

  useEffect(()=>{

    loadUsers();

  },[]);

  function loadUsers(){

    const raw = localStorage.getItem(STORAGE_KEY);

    if(!raw){

      setUsers([]);

      return;

    }

    try{

      setUsers(JSON.parse(raw));

    }

    catch{

      setUsers([]);

    }

  }

  function deleteUser(index){

    if(!window.confirm("Hapus user ini?")) return;

    const copy = [...users];

    copy.splice(index,1);

    localStorage.setItem(STORAGE_KEY,JSON.stringify(copy));

    setUsers(copy);

  }

  const filtered = users.filter(user=>{

    const key = keyword.toLowerCase();

    return(

      user.fullName.toLowerCase().includes(key) ||

      user.email.toLowerCase().includes(key)

    );

  });

  const adminCount = users.filter(user=>user.role==="admin").length;

  const operatorCount = users.filter(user=>user.role==="operator").length;

  return(

<div className="admin-content">

<div className="page-header">

<div>

<h2>Pengguna</h2>

<p>
Kelola akun administrator dan operator.
</p>

</div>

<button className="btn-primary">

<Plus size={18}/>

Tambah Pengguna

</button>

</div>

<section className="admin-stats">

<div className="stat-box red">

<h2>{users.length}</h2>

<span>Total User</span>

</div>

<div className="stat-box blue">

<h2>{adminCount}</h2>

<span>Administrator</span>

</div>

<div className="stat-box green">

<h2>{operatorCount}</h2>

<span>Operator</span>

</div>

</section>

<div className="toolbar">

<div className="search-box">

<Search size={18}/>

<input
type="text"
placeholder="Cari pengguna..."
value={keyword}
onChange={(e)=>setKeyword(e.target.value)}
/>

</div>

</div>

<div className="user-grid">

{filtered.map((user,index)=>(

<div
className="user-card"
key={index}
>

<div className="user-avatar">

{user.fullName?.charAt(0).toUpperCase()}

</div>

<div className="user-info">

<h3>

{user.fullName}

</h3>

<p>

{user.email}

</p>

<span className={`role ${user.role}`}>

{user.role==="admin" ? (

<Shield size={14}/>

):(

<User size={14}/>

)}

{user.role}

</span>

</div>

<div className="user-action">

<button>

<Pencil size={17}/>

</button>

<button
onClick={()=>deleteUser(index)}
>

<Trash2 size={17}/>

</button>

</div>

</div>

))}

</div>

</div>

  );

}