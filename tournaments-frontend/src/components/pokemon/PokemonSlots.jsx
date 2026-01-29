import {
    DndContext,
    closestCenter,
} from "@dnd-kit/core";

import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import PokemonSlot from "./PokemonSlot";

export default function PokemonSlot({ position, member, onAdd }) {
    if (!member) {
        return (
            <div
                onClick={() => onAdd(position)}
                className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-gray-100"
            >
                <span className="text-gray-500">+ Add Pokémon</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-4 shadow">
            <img src={member.sprite} alt={member.name} />
            <p className="capitalize">{member.name}</p>
        </div>
    );
}

