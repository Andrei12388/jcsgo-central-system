import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import autoTable from 'jspdf-autotable'
import '../App.css'
import { useNotification } from '../components/notificationToast'
import Calendar from '../components/calendar'
import StatsBarGraph from '../components/StatsBarGraph'
import LoadingSpinner from '../components/ui/LoadingSpinner'


const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxOGv2Dz4LF8g2HodyKYvtE7lJ_6tkIPZKVEL4QUYfNhYk7GwucSUTKuANHooKwtyrO/exec'

const STATUS_OPTIONS = [
  '1st Timer',
  '2nd Timer',
  '3rd Timer',
  '4th Timer',
  'Regular/Active',
]

const CATEGORY_OPTIONS = ['Men', 'Women', 'Young Boys', 'Young Girls']
const MARITAL_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed']
const MINISTRY_OPTIONS = ['Music', 'Dance', 'Program', 'MultiMedia']

function MemberSystemPage() {
  const { notify } = useNotification()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedCelebration = searchParams.get('time') || ''
  const selectedTitle = searchParams.get('title') || 'Member System'

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [pdfFontSize, setPdfFontSize] = useState(6)
  const [pdfCellPadding, setPdfCellPadding] = useState(1)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [sortKey, setSortKey] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 30
  const [form, setForm] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [discipleSearch, setDiscipleSearch] = useState('')
  const [leaderSearch, setLeaderSearch] = useState('')

  //Export filters
  const [exportBirthStart, setExportBirthStart] = useState('')
const [exportBirthEnd, setExportBirthEnd] = useState('')

const [showExportModal, setShowExportModal] = useState(false)
const openExportModal = () => setShowExportModal(true)
const closeExportModal = () => setShowExportModal(false)

const [exportStatus, setExportStatus] = useState([])
const [exportCategory, setExportCategory] = useState([])
const [exportMarital, setExportMarital] = useState([])

const toggleValue = (value, setState, state) => {
  if (state.includes(value)) {
    setState(state.filter((v) => v !== value))
  } else {
    setState([...state, value])
  }
}

  const tableRef = useRef(null)
  const statsRef = useRef(null)

  const callAPI = async (payload) => {
    if (selectedCelebration && payload.action !== 'landingSelection') {
      payload.time = selectedCelebration
    }

    const res = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return res.json()
  }

  const goToVineAttendance = () => {
    navigate(`/vine-attendance?time=${encodeURIComponent(selectedCelebration)}`)
  }

  const goToDashboard = () => {
    navigate(`/dashboard?time=${encodeURIComponent(selectedCelebration)}&title=${encodeURIComponent(selectedTitle)}`)
  }

  const formatDate = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (isNaN(date)) return value
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const fetchData = () => {
    setLoading(true)
    const url = selectedCelebration
      ? `${WEB_APP_URL}?time=${encodeURIComponent(selectedCelebration)}`
      : WEB_APP_URL

    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        const fetched = res.data || []
        const withIndex = fetched.map((row, i) => ({ ...row, _rowIndex: i + 2 }))
        setData(withIndex)
        if (withIndex.length > 0 && !sortKey) {
          setSortKey(Object.keys(withIndex[0])[0])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [selectedCelebration])

  useEffect(() => {
    document.body.className = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  const headers = data.length > 0 ? Object.keys(data[0]).filter((k) => k !== '_rowIndex') : []

  const normalizeKey = (key) => key.toLowerCase().replace(/[_-]/g, ' ').trim()

  const FIELD_LABELS = {
    'first name': 'First Name',
    'last name': 'Last Name',
    'middle name': 'Middle Name',
    address: 'Address',
    'home address': 'Home Address',
    'present address': 'Present Address',
    age: 'Age',
    gender: 'Gender',
    birthdate: 'Birth Date',
    'b. date': 'Birth Date',
    status: 'Status',
    'marital status': 'Marital Status',
    category: 'Category',
    celebration: 'Celebration Time',
    ministry: 'Ministry',
    contact: 'Contact Number',
    'phone number': 'Phone Number',
    email: 'Email Address',
  }

  const getLabel = (key) => FIELD_LABELS[normalizeKey(key)] || key
  const isLeaderKey = (key) => normalizeKey(key).includes('care group leader')
  const getLeaderFieldKey = () => headers.find((key) => isLeaderKey(key))
  const getDiscipleFieldKey = () => headers.find((key) => normalizeKey(key) === 'disciples' || normalizeKey(key).includes('disciple'))

  const findMemberById = (id) => {
    if (id === undefined || id === null) return null
    const normalizedId = String(id).trim()
    return data.find((member) => String(member.id).trim() === normalizedId)
  }

  const getFullName = (row) => {
    if (!row) return ''
    const firstNameKey = headers.find((key) => normalizeKey(key) === 'first name')
    const lastNameKey = headers.find((key) => normalizeKey(key) === 'last name')
    const fullNameKey = headers.find((key) => ['fullname', 'full name'].includes(normalizeKey(key)))
    const first = firstNameKey ? row[firstNameKey] : ''
    const last = lastNameKey ? row[lastNameKey] : ''
    const fullName = [first, last].filter(Boolean).join(' ').trim()
    if (fullName) return fullName
    if (fullNameKey && row[fullNameKey]) return String(row[fullNameKey]).trim()
    return row.id || 'Member'
  }

  const getFirstName = (row) => {
    if (!row) return ''
    const firstNameKey = headers.find((key) => normalizeKey(key) === 'first name')
    if (firstNameKey && row[firstNameKey]) return row[firstNameKey]
    const fullNameKey = headers.find((key) => ['fullname', 'full name'].includes(normalizeKey(key)))
    const fullName = fullNameKey ? String(row[fullNameKey] || '').trim() : ''
    if (fullName) return fullName.split(' ')[0] || fullName
    return ''
  }

  const getMemberImage = (row) => {
    const imageKey = headers.find((key) => normalizeKey(key) === 'image')
    const imageValue = imageKey ? String(row[imageKey] || '').trim() : ''
    if (imageValue) return imageValue
    const categoryKey = headers.find((key) => normalizeKey(key) === 'category')
    const categoryValue = categoryKey ? String(row[categoryKey] || '').trim().toLowerCase() : ''
    if (categoryValue.includes('women') || categoryValue.includes('girl')) return '/female.jpg'
    if (categoryValue.includes('men') || categoryValue.includes('boy')) return '/male.jpg'
    return null
  }

  const getMemberNameById = (id) => {
    const member = findMemberById(id)
    if (!member) return `#${id}`
    return getFullName(member)
  }

  const parseMemberIds = (value) =>
    String(value || '')
      .split(/[,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)

  const getDiscipleIds = () => {
    const fieldKey = getDiscipleFieldKey()
    return fieldKey ? parseMemberIds(form[fieldKey]) : []
  }

  const getLeaderId = () => {
    const fieldKey = getLeaderFieldKey()
    return fieldKey ? String(form[fieldKey] || '') : ''
  }

  const getDiscipleOptions = () => {
    const selectedIds = getDiscipleIds()
    return data
      .filter((member) => String(member.id) !== String(form.id))
      .map((member) => ({ id: String(member.id), name: getFullName(member) }))
      .sort((a, b) => {
        const aSelected = selectedIds.includes(a.id)
        const bSelected = selectedIds.includes(b.id)
        if (aSelected !== bSelected) return aSelected ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }

  const getLeaderOptions = () => {
    const selectedLeaderId = getLeaderId()
    return data
      .filter((member) => String(member.id) !== String(form.id))
      .map((member) => ({ id: String(member.id), name: getFullName(member) }))
      .sort((a, b) => {
        if (a.id === selectedLeaderId && b.id !== selectedLeaderId) return -1
        if (b.id === selectedLeaderId && a.id !== selectedLeaderId) return 1
        return Number(a.id) - Number(b.id)
      })
  }

  const setLeaderId = (id) => {
    const fieldKey = getLeaderFieldKey()
    if (!fieldKey) return
    handleChange(fieldKey, String(id).trim())
  }

  const setDiscipleIds = (ids) => {
    const fieldKey = getDiscipleFieldKey()
    if (!fieldKey) return
    handleChange(fieldKey, ids.join(','))
  }

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const convertImageToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const SIZE = 400
          canvas.width = SIZE
          canvas.height = SIZE
          ctx.drawImage(img, 0, 0, SIZE, SIZE)
          const compressed = canvas.toDataURL('image/jpeg', 0.3)
          resolve(compressed)
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const resetForm = () => {
    setForm({})
    setIsEditing(false)
    setEditId(null)
    setDiscipleSearch('')
    setLeaderSearch('')
    setShowForm(false)
  }

  const handleAdd = async () => {
    setActionLoading(true)
    const res = await callAPI({ action: 'add', data: form })
    setActionLoading(false)
    if (res.status === 'success') {
      notify.success('Member added successfully')
      resetForm()
      fetchData()
    } else {
      notify.error(res.message)
    }
  }

  const startEdit = (row) => {
    const formattedRow = { ...row }
    headers.forEach((key) => {
      if (key.toLowerCase().includes('date') && row[key]) {
        const date = new Date(row[key])
        if (!isNaN(date)) {
          formattedRow[key] = date.toISOString().split('T')[0]
        }
      }
    })
    setIsEditing(true)
    setEditId(row.id)
    setForm(formattedRow)
    setDiscipleSearch('')
    setLeaderSearch('')
    setShowForm(true)
  }

  const handleEdit = async () => {
    setActionLoading(true)
    const res = await callAPI({ action: 'edit', id: editId, data: form })
    setActionLoading(false)
    if (res.status === 'success') {
      notify.success('Member updated successfully')
      resetForm()
      fetchData()
    } else {
      notify.error(res.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member?')) return
    setActionLoading(true)
    const res = await callAPI({ action: 'delete', id })
    setActionLoading(false)
    if (res.status === 'success') {
      notify.success('Deleted successfully')
      fetchData()
    } else {
      alert(res.message)
    }
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const compareValues = (a, b) => {
    const valA = a ?? ''
    const valB = b ?? ''
    if (!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
      return Number(valA) - Number(valB)
    }
    return String(valA).localeCompare(String(valB), undefined, { sensitivity: 'base' })
  }

  const categoryKey = headers.find((key) => normalizeKey(key) === 'category')

  const filteredData = data.filter((row) =>
    headers.some((key) => {
      const value = row[key]
      return value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  )

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0
    if (categoryKey) {
      const categoryComparison = compareValues(a[categoryKey], b[categoryKey])
      if (categoryComparison !== 0) return categoryComparison
    }
    const valA = a[sortKey]
    const valB = b[sortKey]
    const comparison = compareValues(valA, valB)
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage))

  const exportStatsPDF = async () => {
    const input = statsRef.current
    if (!input) return
    const canvas = await html2canvas(input, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    const pdfBlob = pdf.output('blob')
    const url = URL.createObjectURL(pdfBlob)
    window.open(url)
  }


  const generatePdfPreview = () => {
    // Year date onyl
   const getBirthYear = (value) => {
  const d = new Date(value)
  if (!isNaN(d)) return d.getFullYear()

  const parts = String(value).split(',')
  return parts[1] ? Number(parts[1].trim()) : null
}

   //Filter Functions
   const filteredExportData = sortedData.filter((row) => {
  const statusMatch =
  exportStatus.length === 0 ||
  exportStatus.includes(row['Status'])

const categoryMatch =
  exportCategory.length === 0 ||
  exportCategory.includes(row['Category'])

const maritalMatch =
  exportMarital.length === 0 ||
  exportMarital.includes(row['Marital Status'])

  let birthdayMatch = true

if (birthdayKey && (exportBirthStart || exportBirthEnd)) {
  const year = getBirthYear(row[birthdayKey])

  if (year) {
    const startYear = exportBirthStart
      ? Number(exportBirthStart.slice(0, 4))
      : 1900

    const endYear = exportBirthEnd
      ? Number(exportBirthEnd.slice(0, 4))
      : 3000

    birthdayMatch = year >= startYear && year <= endYear
  } else {
    birthdayMatch = false
  }
}

  return (
    statusMatch &&
    categoryMatch &&
    maritalMatch &&
    birthdayMatch
  )
})

    const doc = new jsPDF('l', 'mm', 'a4')
    const pdfHeaders = headers.filter((key) => key.toLowerCase() !== 'image')
    const tableColumn = [...pdfHeaders, 'Disciples']
    const tableRows = filteredExportData.map((row) => {
      const rowData = pdfHeaders.map((key) => {
        const value = row[key] || ''
        if (key.toLowerCase().includes('date')) return formatDate(value)
        if (isLeaderKey(key)) return value ? getMemberNameById(value) : ''
        return String(value)
      })
      rowData.push(String(getDiscipleCount(row)))
      return rowData
    })

    doc.setFontSize(12)

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: pdfFontSize, cellPadding: pdfCellPadding },
      headStyles: { fillColor: [7, 17, 65], textColor: 255 },
    })
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl)
  }

  const getMemberDisciples = (member) => {
    const leaderKey = getLeaderFieldKey()
    if (!leaderKey || !member?.id) return []
    return data.filter((row) => String(row[leaderKey] || '').trim() === String(member.id).trim())
  }

  const getDiscipleCount = (member) => getMemberDisciples(member).length

  const getSelectOptions = (key) => {
    const k = key.trim().toLowerCase()
    switch (k) {
      case 'status':
        return STATUS_OPTIONS
      case 'celebration':
        return []
      case 'category':
        return CATEGORY_OPTIONS
      case 'marital status':
        return MARITAL_OPTIONS
      case 'ministry':
        return MINISTRY_OPTIONS
      default:
        return null
    }
  }

  const renderMemberReferenceSummary = (value) => {
    const ids = parseMemberIds(value)
    if (ids.length === 0) return null
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        {ids.map((id) => {
          const member = findMemberById(id)
          if (!member) {
            return (
              <div key={id} style={{ padding: 12, borderRadius: 10, background: theme === 'dark' ? '#1d1d1d' : '#f5f5f5' }}>
                #{id}
              </div>
            )
          }
          const image = getMemberImage(member)
          return (
            <div key={id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 10, background: theme === 'dark' ? '#1d1d1d' : '#f5f5f5' }}>
              {image ? (
                <img src={image} alt={getFullName(member)} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 10, background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                  No Image
                </div>
              )}
              <div>
                <button type='button' onClick={() => openMemberModal(member)} style={{ background: 'none', border: 'none', color: '#0b5fff', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit', textAlign: 'left' }}>
                  {getFullName(member)}
                </button>
                <div style={{ opacity: 0.75, fontSize: 12 }}>ID: {member.id || id}</div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const openMemberModal = (row) => setSelectedMember(row)
  const closeMemberModal = () => setSelectedMember(null)

  const getMemberReferenceElements = (value) => {
    const ids = parseMemberIds(value)
    if (ids.length === 0) return null
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        {ids.map((id, index) => {
          const member = findMemberById(id)
          const name = getMemberNameById(id)
          return (
            <div key={`${id}-${index}`} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 10 }}>
              <div>
                {member ? (
                  <button type='button' onClick={() => openMemberModal(member)} style={{ background: 'none', border: 'none', color: '#0b5fff', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit', textAlign: 'left' }}>
                    {name}
                  </button>
                ) : (
                  <div>{name}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const getCurrentDate = () =>
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const birthdayKey = headers.find((h) => h.toLowerCase().includes('b. date') || h.toLowerCase().includes('birth'))
  const getUpcomingBirthdays = () => {
    if (!birthdayKey) return []
    const today = new Date()
    const monday = new Date(today)
    const day = monday.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    monday.setDate(monday.getDate() + diffToMonday)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return data.filter((row) => {
      const birthValue = row[birthdayKey]
      if (!birthValue) return false
      const birthDate = new Date(birthValue)
      if (isNaN(birthDate)) return false
      const currentYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
      return currentYearBirthday >= monday && currentYearBirthday <= sunday
    })
  }

  const upcomingBirthdays = getUpcomingBirthdays()

  const isBusy = loading || actionLoading

  return (
    <div style={{ minHeight: '100vh',width: "100%", padding: 20, display: 'flex', flexDirection: 'column' }}>
       {actionLoading && (
  <div className="loading-overlay">
    <div className="spinner" />
    <p>Processing...</p>
  </div>
)}
     
      <main style={{ flex: 1, }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
            <h2 style={{ marginTop: 0 }}><strong>Members</strong></h2>
            <p style={{ margin: 0,  }}>
              Search, edit, and manage member records here.
            </p>
          </div>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
            <h2 style={{ marginTop: 0 }}><strong>Reports</strong></h2>
            <p style={{ margin: 0,  }}>
              Export member PDFs, Statistics with Graphs, and view birthdays.
            </p>
          </div>
        </div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
         
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
           {upcomingBirthdays.length > 0 && (
        <div style={{ width: '100%', boxSizing: 'border-box', background: '#ffe082', padding: '15px', borderRadius: '10px', marginBottom: '20px', marginTop: '20px', color: '#000', fontWeight: 'bold' }}>
          🎂 Birthday This Week (Monday - Sunday)
          <ul style={{ marginTop: 10 }}>
            {upcomingBirthdays.map((person, index) => (
              <li key={index}>{person['First Name']} {person['Last Name']} — {formatDate(person[birthdayKey])}</li>
            ))}
          </ul>
        </div>
      )}
          <button onClick={() => setShowStats((prev) => !prev)} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            {showStats ? 'Hide Statistics' : 'Show Statistics'}
          </button>
           <button onClick={() => { resetForm(); setShowForm(true) }} style={{ padding: '10px 20px', cursor: actionLoading ? 'not-allowed' : 'pointer' }} disabled={actionLoading}>
            Add Member
          </button>
          <button onClick={() => setShowExportModal(true)} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Export Members PDF
          </button>

          {showExportModal && (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      color: theme === 'dark' ? '#fff' : '#000',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    }}
  >
    <div className="animationCard"
      onClick={(e) => e.stopPropagation()}
      style={{
        background: theme === 'dark' ? 'var(--card)' : 'var(--card)', 
        color: theme === 'dark' ? '#fff' : '#000',
        padding: 24,
        borderRadius: 12,
        width: 400,
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex', 
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <h3><strong>Export Members PDF</strong></h3>

      {/* Status */}
<div style={{ position: 'relative' }}>
  <label style={{ fontWeight: 600 }}>Status</label>

  <details>
    <summary style={{ cursor: 'pointer', padding: 8,  border: '1px solid var(--border)' }}>
      {exportStatus.length ? exportStatus.join(', ') : 'All Status'}
    </summary>

    <div style={{ padding: 10,  border: '1px solid var(--border)' }}>
      {STATUS_OPTIONS.map((s) => (
        <label key={s} style={{ display: 'block', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={exportStatus.includes(s)}
            onChange={() => toggleValue(s, setExportStatus, exportStatus)}
          />
          {' '}{s}
        </label>
      ))}
    </div>
  </details>
</div>

  {/* Category */}
<div>
  <label style={{ fontWeight: 600 }}>Category</label>

  <details>
    <summary style={{ cursor: 'pointer', padding: 8, border: '1px solid var(--border)' }}>
      {exportCategory.length ? exportCategory.join(', ') : 'All Category'}
    </summary>

    <div style={{ padding: 10, border: '1px solid var(--border)'  }}>
      {CATEGORY_OPTIONS.map((c) => (
        <label key={c} style={{ display: 'block' }}>
          <input
            type="checkbox"
            checked={exportCategory.includes(c)}
            onChange={() => toggleValue(c, setExportCategory, exportCategory)}
          />
          {' '}{c}
        </label>
      ))}
    </div>
  </details>
</div>

  {/* Marital Status */}
<div>
  <label style={{ fontWeight: 600 }}>Marital Status</label>

  <details>
    <summary style={{ cursor: 'pointer', padding: 8, border: '1px solid var(--border)'}}>
      {exportMarital.length ? exportMarital.join(', ') : 'All Marital'}
    </summary>

    <div style={{ padding: 10, border: '1px solid var(--border)' }}>
      {MARITAL_OPTIONS.map((m) => (
        <label key={m} style={{ display: 'block' }}>
          <input
            type="checkbox"
            checked={exportMarital.includes(m)}
            onChange={() => toggleValue(m, setExportMarital, exportMarital)}
          />
          {' '}{m}
        </label>
      ))}
    </div>
  </details>
</div>

  {/* Birth Year Range */}
  <div style={{ display: 'flex', gap: 10 }}>
    
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
        Birth Year From
      </label>
      <input
        type="number"
        value={exportBirthStart}
        onChange={(e) => setExportBirthStart(e.target.value)}
        style={{ width: '100%', padding: 8, borderRadius: 6 }}
        placeholder="e.g. 1990"
      />
    </div>

    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
        Birth Year To
      </label>
      <input
        type="number"
        value={exportBirthEnd}
        onChange={(e) => setExportBirthEnd(e.target.value)}
        style={{ width: '100%', padding: 8, borderRadius: 6 }}
        placeholder="e.g. 2000"
      />
    </div>

  </div>

  {/* Buttons */}
  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
    <button onClick={generatePdfPreview}>
      Export
    </button>

    <button onClick={closeExportModal}>
      Cancel
    </button>
  </div>
    </div>
  </div>
)}
         
         
        </div>
        {showStats && (
          <div className="animationCard" style={{ position: 'fixed', top: '15px', left: '10px', width: '97%', height: '92vh', background: theme === 'dark' ? 'var(--card)' : 'var(--card)', color: theme === 'dark' ? '#fff' : '#000', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 1000, overflowY: 'auto' }}>
            <button onClick={() => setShowStats(false)} style={{ position: 'absolute', top: 10, right: 25, padding: '10px 20px', cursor: 'pointer' }}>
              Close Statistics
            </button>
            <button onClick={exportStatsPDF} style={{ marginBottom: 20, padding: '10px 20px' }}>
              Export Statistics PDF
            </button>
            <div ref={statsRef}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                <img src='logonotitle.png' width={100} height={50} alt='Logo' />
                <h1 style={{ margin: 0 }}>{selectedTitle}</h1>
              </div>
              <p style={{ marginBottom: 20, fontSize: 16, opacity: 0.8 }}>Current Date: {getCurrentDate()}</p>
              <div style={{ background: '#071141', color: '#fff', padding: 10, marginBottom: 20, textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>
                Total Members: {data.length}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <StatsBarGraph data={data} field='Status' title='Status Count' />
                <StatsBarGraph data={data} field='Ministry' title='Ministry Count' />
                <StatsBarGraph data={data} field='Category' title='Category Count' />
                <StatsBarGraph data={data} field='Marital Status' title='Marital Status Count' />
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex',  flexWrap: 'wrap',justifyItems: "center", justifyContent: "center", borderBottom: '10px solid var(--border)', marginBottom: 20, paddingBottom: 10, gap: 12 }}>
           {/* LOADING SPINNER */}
        {loading && (
          <LoadingSpinner title="Loading Members" />
        )}
        </div>
        <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Prev
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Next
          </button>
          <div style={{ display: 'flex', alignItems: 'center' }}><input
            type='text'
            placeholder='Search member...'
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            style={{ padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid #ccc' }}
          /></div>
          <select value={currentPage} onChange={(e) => setCurrentPage(Number(e.target.value))} style={{ padding: '10px', borderRadius: 8 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <option key={i + 1} value={i + 1}>Page {i + 1}</option>
            ))}
          </select>
          
        </div>
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)' }}>
        <table border='1' cellPadding='8' width='100%' ref={tableRef}>
          <thead>
            <tr>
              <th>#</th>
              {headers.map((key) => (
                <th key={key} onClick={() => handleSort(key)} style={{ cursor: 'pointer' }}>{key}</th>
              ))}
              <th>Disciples</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => (
              <tr key={i} onClick={() => openMemberModal(row)} style={{ cursor: 'pointer' }}>
                <td>{startIndex + i + 1}</td>
                {headers.map((key) => {
                  const normalized = normalizeKey(key)
                  const isFirstName = normalized === 'first name' || normalized === 'fullname'
                  return (
                    <td key={key}>
                      {key.toLowerCase() === 'image' ? (
                        (() => {
                          const image = getMemberImage(row)
                          return image ? (
                            <img src={image} alt='member' style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                          ) : (
                            'No Image'
                          )
                        })()
                      ) : normalized.includes('date') ? (
                        formatDate(row[key])
                      ) : isLeaderKey(key) ? (
                        row[key] ? getMemberNameById(row[key]) : '-'
                      ) : isFirstName ? (
                        getFirstName(row) || row[key]
                      ) : (
                        row[key]
                      )}
                    </td>
                  )
                })}
                <td>{getDiscipleCount(row)}</td>
                <td>
                  <button onClick={(e) => { e.stopPropagation(); startEdit(row) }} disabled={actionLoading} style={{ marginRight: 8, padding: '6px 12px', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                    Edit
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }} disabled={actionLoading} style={{ padding: '6px 12px', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Prev
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Next
          </button>
          
          <select value={currentPage} onChange={(e) => setCurrentPage(Number(e.target.value))} style={{ padding: '10px', borderRadius: 8 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <option key={i + 1} value={i + 1}>Page {i + 1}</option>
            ))}
          </select>
          
        </div>
      </main>
      {showForm && (
        <div  style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="animationCard" style={{ background: theme === 'dark' ? 'var(--card)' : 'var(--card)', color: theme === 'dark' ? '#fff' : '#000', padding: 50, borderRadius: 10, width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: theme === 'dark' ? '#fff' : 'var(--text)', textAlign: 'center' }}>{isEditing ? 'Edit Member' : 'Add Member'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {headers.map((key) =>
                key !== 'id' && (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <label style={{color: theme === 'dark' ? '#fff' : 'var(--text)', display: 'block', marginBottom: 5, fontWeight: 600 }}>{getLabel(key)}</label>
                    {getSelectOptions(key) ? (
                      <select value={form[key] || ''} onChange={(e) => handleChange(key, e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc' }}>
                        <option value=''>Select {getLabel(key)}</option>
                        {getSelectOptions(key).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : isLeaderKey(key) ? (
                      <div style={{ position: 'relative' }}>
                        <input type='text' value={leaderSearch} onChange={(e) => setLeaderSearch(e.target.value)} placeholder='Search leader...' style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc', marginBottom: 8 }} />
                        <div style={{ maxHeight: 220, overflowY: 'auto', padding: 8, border: '1px solid #ccc',display: 'flex', flexDirection: 'column', alignItems: 'flex-start', borderRadius: 8, background: theme === 'dark' ? 'var(--card)' : 'var(--card)', color: theme === 'dark' ? '#fff' : 'var(--text)' }}>
                          {getLeaderOptions().filter((option) => option.name.toLowerCase().includes(leaderSearch.toLowerCase())).map((option) => (
                            <label key={option.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10, padding: '6px 0', cursor: 'pointer',  width: "100%", textWrap: "nowrap" }}>
                              <input type='radio' name='careGroupLeader' checked={String(getLeaderId()).trim() === String(option.id).trim()} onChange={() => setLeaderId(option.id)} />
                              <span>{option.name}</span>
                            </label>
                          ))}
                          {getLeaderOptions().filter((option) => option.name.toLowerCase().includes(leaderSearch.toLowerCase())).length === 0 && (
                            <div style={{ opacity: 0.7, padding: 10 }}>No leader found.</div>
                          )}
                        </div>
                      </div>
                    ) : key.toLowerCase() === 'image' ? (
                      <div>
                        {form[key] && (
                          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 10, alignItems: 'center' }}>
                            <img src={form[key]} alt='preview' style={{ width: 100, height: 100, objectFit: 'cover', marginTop: 10, borderRadius: 8 }} />
                          </div>
                        )}
                        <input type='file' accept='image/*' onChange={async (e) => {
                          const file = e.target.files[0]
                          if (!file) return
                          const base64 = await convertImageToBase64(file)
                          handleChange(key, base64)
                        }} />
                      </div>
                    ) : (
                      <input type={key.toLowerCase().includes('date') ? 'date' : 'text'} placeholder={key} value={form[key] || ''} onChange={(e) => handleChange(key, e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc' }} />
                    )}
                  </div>
                )
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={isEditing ? handleEdit : handleAdd} disabled={actionLoading} style={{ padding: '10px 20px', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? (isEditing ? 'Saving...' : 'Adding...') : isEditing ? 'Save' : 'Add'}
                </button>
                <button onClick={resetForm} disabled={actionLoading} style={{ padding: '10px 20px', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedMember && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }} onClick={closeMemberModal}>
          <div className="animationCard" style={{ background: theme === 'dark' ? '#222' : '#fff', color: theme === 'dark' ? '#fff' : '#000', padding: 24, borderRadius: 14, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeMemberModal} style={{ position: 'absolute', top: 16, right: 16, padding: '8px 14px', cursor: 'pointer' }}>Close</button>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 18 }}>
              {getMemberImage(selectedMember) ? (
                <img src={getMemberImage(selectedMember)} alt={getFullName(selectedMember)} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14 }} />
              ) : (
                <div style={{ width: 120, height: 120, borderRadius: 14, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 14, textAlign: 'center', padding: 10 }}>
                  No Image
                </div>
              )}
              <div>
                <h2 style={{ margin: 0 }}>{getFullName(selectedMember)}</h2>
                <div style={{ opacity: 0.75, marginTop: 6 }}>ID: {selectedMember.id || 'N/A'}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
              {headers.map((key) => {
                if (key.toLowerCase() === 'image' || key.toLowerCase() === 'id' || isLeaderKey(key)) return null
                return (
                  <div key={key} style={{ lineHeight: 1.6 }}>
                    <strong>{getLabel(key)}:</strong>{' '}
                    {normalizeKey(key).includes('date') ? formatDate(selectedMember[key]) : selectedMember[key] || '-'}
                  </div>
                )
              })}
            </div>
            <div style={{ marginBottom: 24 }}>
              <strong>Care Group Leader:</strong>
              <div style={{ marginTop: 12 }}>{renderMemberReferenceSummary(selectedMember[headers.find((key) => isLeaderKey(key))]) || 'None'}</div>
            </div>
            <div>
              <strong>Disciples:</strong>
              <div style={{ marginTop: 12 }}>
                {getMemberDisciples(selectedMember).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    {getMemberDisciples(selectedMember).map((disciple) => {
                      const image = getMemberImage(disciple)
                      return (
                        <div key={disciple.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 10, background: theme === 'dark' ? '#1d1d1d' : '#f5f5f5' }}>
                          {image ? (
                            <img src={image} alt={getFullName(disciple)} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10 }} />
                          ) : (
                            <div style={{ width: 56, height: 56, borderRadius: 10, background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 12 }}>No Image</div>
                          )}
                          <div>
                            <button type='button' onClick={() => openMemberModal(disciple)} style={{ background: 'none', border: 'none', color: '#0b5fff', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit', textAlign: 'left' }}>
                              {getFullName(disciple)}
                            </button>
                            <div style={{ opacity: 0.7, fontSize: 12 }}>ID: {disciple.id}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  'None'
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}

export default MemberSystemPage