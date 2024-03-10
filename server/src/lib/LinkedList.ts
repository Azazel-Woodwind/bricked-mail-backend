export class ListNode<T> {
    value: T;
    next: ListNode<T> | null;
    prev: ListNode<T> | null;

    constructor(value: T) {
        this.value = value;
        this.next = null;
        this.prev = null;
    }
}

export default class LinkedList<T> {
    public head: ListNode<T> | null;
    public tail: ListNode<T> | null;

    constructor() {
        this.head = null;
        this.tail = null;
    }

    append(value: T): void {
        const newNode = new ListNode(value);
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            if (this.tail) {
                this.tail.next = newNode;
                newNode.prev = this.tail;
            }
        }
    }

    prepend(value: T): void {
        const newNode = new ListNode(value);
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            this.head.prev = newNode;
            newNode.next = this.head;
            this.head = newNode;
        }
    }

    deleteFront(): void {
        if (!this.head) {
            return;
        }

        if (this.head === this.tail) {
            this.head = null;
            this.tail = null;
            return;
        }

        this.head = this.head.next;
        this.head!.prev = null;
    }

    deleteBack(): void {
        if (!this.tail) {
            return;
        }

        if (this.head === this.tail) {
            this.head = null;
            this.tail = null;
            return;
        }

        this.tail = this.tail.prev;
        this.tail!.next = null;
    }

    isEmpty(): boolean {
        return !this.head;
    }

    *[Symbol.iterator](): Iterator<T> {
        let current = this.head;
        while (current !== null) {
            yield current.value;
            current = current.next;
        }
    }
}
