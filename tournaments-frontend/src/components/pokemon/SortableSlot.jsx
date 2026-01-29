function SortableSlot({ slot }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: slot.position,
        data: { position: slot.position },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
        >
            <PokemonSlot
                position={slot.position}
                member={slot.empty ? null : slot}
                onAdd={onAdd}
            />

        </div>
    );
}
