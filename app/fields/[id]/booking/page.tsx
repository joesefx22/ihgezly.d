// app/fields/[id]/booking/page.tsx
export default function BookingPage({ params }: { params: { id: string } }) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [slots, setSlots] = useState([])
  
  // توليد الأيام العشرة
  const days = generateNextTenDays()
  
  // عند اختيار يوم
  const handleSelectDate = async (date: Date) => {
    const response = await fetch(`/api/fields/${params.id}/slots?date=${date}`)
    const data = await response.json()
    setSlots(data.slots)
  }
  
  return (
    <div>
      <DaySelector days={days} onSelect={handleSelectDate} />
      <SlotGrid slots={slots} onSelectSlot={handleBookSlot} />
    </div>
  )
}
