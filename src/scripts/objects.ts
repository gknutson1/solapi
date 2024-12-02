const CardBack = "https://deckofcardsapi.com/static/img/back.png"
const CardFrame = "/frames/base.png"
const Offset = 5

interface Base {
    success: boolean
    deck_id: string
    remaining: number
}

interface Deck extends Base {
    shuffled: boolean
}

interface Card {
    code: string
    image: string
    value: string
    suit: string
}

interface DrawResponse extends Base {
    cards: Card[]
}

interface Pile {
    cards: Card[]
    remaining: number
}

interface PileDrawResponse extends DrawResponse {
    piles: Pile[]
}

export type { Base, Deck, Card, DrawResponse, Pile, PileDrawResponse }

export { CardBack, CardFrame, Offset }