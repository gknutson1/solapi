import type {Base, Deck, DrawResponse, Card} from "./objects"
import {CardBack, CardFrame, Offset} from "./objects"

var id: string;
let game_started = false;

let wastePile: string[] = []
let remains = 1

//-----------------//
// Utility methods //
//-----------------//
class Lock {
    count = 0
    inactive = "Ready"
    active = "Please Wait"

    release() {
        if (this.count > 0) { this.count--; }
        if (this.count <= 0) { // @ts-ignore
            document.querySelector(".status").textContent = this.inactive
        }
    }

    take() {
        this.count++
        if (this.count > 0) { // @ts-ignore
            document.querySelector(".status").textContent = this.active
        }
    }
}

const lock = new Lock()

async function call<Type extends Base>(str: string, id?: string, query?: Record<string, any>): Promise<Type> {
    let url = "https://deckofcardsapi.com/api/deck";
    if (id) { url += '/' + id }
    url += str
    if (query) {url += "?" + new URLSearchParams(query)}

    function onFetch(data: Response): Promise<Base> {
        lock.release()
        return data.json().then(onJson, x => onJsonError(x, data))
    }

    function onFetchError(err: any): any {
        lock.release()
        console.error("Could not fetch \"" + url + "\" - received the following error: ", err)
    }

    function onJson(data: Type): Type {
        if (! ('success' in data) || ! data.success) {
            console.error("fetched and decoded \"" + url + "\" but parsed JSON response indicates failuer ir is malformed: ", data)
        } else {
            console.log("Request completed successfully", url, data)
        }
        return data
    }

    function onJsonError(err: any, data: Response): any {
        console.error("fetched \"" + url + "\" but encountered a JSON decoding error: ", err, "while decoding this data as JSON: ", data.body)
    }

    lock.take()
    return fetch(url).then(onFetch, onFetchError)
}

let selected: HTMLElement | null = null;

function select(ev: MouseEvent) {
    let target = ev.target as HTMLElement
    console.log("selected: ", target, "previous element was: ", selected)
    if (selected == null) { // If selected is null, make target active
        selected = target;
        target.classList.add("selected");
    } else if (selected == target) { // If same element is selected, deactivate target
        selected = null;
        target.classList.remove("selected");
    } else { // If different element
        // @ts-ignore
        if (selected.parentElement.parentElement.id.startsWith('tableau')) {
            moveFromTableau(target) // Handle when source is in the tableau
        }
    }
}

function moveFromTableau(target: HTMLElement) {
    // @ts-ignore
    if (target.parentElement.parentElement.id.startsWith('tableau')) {
        // If we are moving from tableau to different section of tableau
        // @ts-ignore
        if (verifyMove(target.getAttribute("alt"), selected?.getAttribute("alt"))) {
            // If our move is actually valid
            // @ts-ignore
            let tableau = selected.parentElement.parentElement
            console.log(tableau)
            // Do the move
            // @ts-ignore
            target.parentElement.parentElement.appendChild(selected?.parentElement)
            // @ts-ignore
            reveal(tableau)
        }


        // @ts-ignore
        selected.classList.remove("selected");
        selected = null
    }
    // @ts-ignore
    if (target.classList.contains("foundation")) {
        // @ts-ignore
        target.setAttribute("src", selected?.getAttribute("src"))
        // @ts-ignore
        let tbl = selected.parentElement.parentElement;
        // @ts-ignore
        selected.parentElement.remove()
        selected = null
        console.log(tbl)
        reveal(tbl)
    }
}

function reveal(tableau: HTMLElement) {
    // @ts-ignore
    const childCount = tableau.children.length
    // @ts-ignore
    let nextCard = tableau.children[childCount - 1]
    if (nextCard != null) { nextCard = nextCard.children[0]}

    console.log("next card: ", nextCard)

    if (nextCard == null) {}
    else if (nextCard.getAttribute("src") == CardBack) {
        nextCard.setAttribute("src", `https://deckofcardsapi.com/static/img/${nextCard.getAttribute("alt")}.png`)
    }
}

const cardOrder: Map<string, number> = new Map([
    ["K", 1],
    ["Q", 2],
    ["J", 3],
    ["0", 4],
    ["9", 5],
    ["8", 6],
    ["7", 7],
    ["6", 8],
    ["5", 9],
    ["4", 10],
    ["3", 11],
    ["2", 12],
    ["A", 13]
])

function verifyMove(target: string, moving: string) {
    console.log(`checking if ${moving} to ${target} is valid`)
    if (target[1] == 'D' || target[1] == 'H') {
        if (moving[1] != 'C' && moving[1] != 'S') {
            console.log(false)
            return false;
        }
    } else if (target[1] == 'C' || target[1] == 'S') {
        if (moving[1] != 'D' && moving[1] != 'H') {
            console.log(false)
            return false;
        }
    }
    let targetOrder = cardOrder.get(target[0]);
    let sourceOrder = cardOrder.get(moving[0]);
    // @ts-ignore
    console.log(sourceOrder == (targetOrder + 1))
    // @ts-ignore
    return sourceOrder == (targetOrder + 1);

}

//-----------------//
// Setup functions //
//-----------------//
async function setupTableau(id: number, resp: DrawResponse) {
    // @ts-ignore
    let base: HTMLElement = document.getElementById("tableau-" + id);
    // @ts-ignore
    let card: Card = resp.cards.pop()

    let cont = document.createElement("div");
    cont.classList.add("stack-positioner")

    let img = document.createElement("img")
    img.setAttribute("alt", "back of card")
    img.classList.add("stacked")

    for(let i = 1; i < id; i++) {

        // @ts-ignore
        let activeCont: HTMLElement = cont.cloneNode()

        // @ts-ignore
        let activeImg: HTMLElement = img.cloneNode()
        activeImg.setAttribute("src", CardBack)
        activeImg.setAttribute("alt", resp.cards[i - 1].code)

        activeCont.append(activeImg)
        base.append(activeCont)
        }

    img.setAttribute("src", card.image)
    img.setAttribute("alt", card.code)
    img.addEventListener("click", select)

    cont.append(img)
    base.append(cont)
}

async function setupDeck(deck: Deck) {
    id = deck.deck_id

    for (let i = 1; i <= 7; i++) {
        call<DrawResponse>("/draw", id, { "count": i }).then(res => setupTableau(i, res), null)
    }
}

async function onStockSelected() {
    if (remains == 0) {
        let data = await call<DrawResponse>("/return", id, { "cards": wastePile.reverse() })
        remains = data.remaining
        wastePile = []
        // @ts-ignore
        const stock: HTMLElement = document.getElementById("stock");
        stock.setAttribute("src", CardBack)
        return
    }

    await call<DrawResponse>("/draw", id, { "count": 1 }).then(res => {
        remains = res.remaining
        const empty = "blank space"
        const card = res.cards[0]
        // @ts-ignore
        const waste: HTMLElement = document.getElementById("waste");
        if (waste.getAttribute("alt") != empty) {
            wastePile.unshift(<string>waste.getAttribute("alt"));
        }
        waste.setAttribute("src", card.image)
        waste.setAttribute("alt", card.code)

    })


    if (remains == 0) {
        // @ts-ignore
        document.getElementById("stock").setAttribute("src", CardFrame)
    }
    console.log(wastePile)
}

async function load() {
    // @ts-ignore
    document.querySelector(".start").addEventListener("click", async () => {
        if (game_started) { location.reload(); return }
        game_started = true;
        call<Deck>("/new/shuffle").then(deck => setupDeck(deck))
    });

    // @ts-ignore
    document.querySelector(".reset").addEventListener("click", () => { location.reload() ; });
    // @ts-ignore
    document.getElementById("stock").addEventListener("click", async () => {onStockSelected()})
    document.querySelectorAll(".foundation").forEach((element) => { // @ts-ignore
        element.addEventListener("click", select)})
}

export { load }
