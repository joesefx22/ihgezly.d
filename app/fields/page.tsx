// app/fields/page.tsx
export default async function FieldsPage({
  searchParams
}: {
  searchParams: { type?: 'football' | 'padel' }
}) {
  const fields = await prisma.field.findMany({
    where: { 
      type: searchParams.type?.toUpperCase(),
      status: 'OPEN'
    }
  })
  
  // جلب المناطق الفريدة للفلتر
  const locations = [...new Set(fields.map(f => f.location))]
  
  return (
    <div>
      <LocationFilter locations={locations} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map(field => (
          <FieldCard key={field.id} field={field} />
        ))}
      </div>
    </div>
  )
}
