export function hasId<T extends { id?: number }>(obj: T): obj is T & IHasId<number> {
    return obj.id !== undefined;
}

interface IHasId<TId> {
    id: TId
}
