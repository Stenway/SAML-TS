/* (C) Stefan John / Stenway / Stenway.com / 2022 */

import { SmlAttribute, SmlDocument, SmlElement } from "./sml.js"

// ----------------------------------------------------------------------

abstract class Utils {
	static validateName(name: string) {
		if (!/\w[\w\d]*/.test(name)) {
			throw new Error(`"${name}" is not a valid name`)
		}
	}
}

// ----------------------------------------------------------------------

export class UiEventArgs {
	
}

// ----------------------------------------------------------------------

export class UiEventHandler<T extends UiEventArgs> {
	private _listeners: ((sender: any, args: T) => void)[] = []

	add(listener: (sender: any, args: T) => void) {
		this._listeners.push(listener)
	}

	remove(listener: (sender: any, args: T) => void) {
		this._listeners = this._listeners.filter(function(x) {x !== listener})
	}

	invoke(sender: any, args: T) {
		for (let listener of this._listeners) {
			listener(sender, args)
		}
	}
}

// ----------------------------------------------------------------------

export class UiItemsNode {
	readonly name: string

	constructor(name: string) {
		//Utils.validateName(name)
		this.name = name
	}
}

// ----------------------------------------------------------------------

export class UiItem extends UiItemsNode {

	title: string | null = null
	hint: string | null = null

	constructor(name: string) {
		super(name)
	}
}

// ----------------------------------------------------------------------

export class UiStringItem extends UiItem {
	private _value: string = ""
	readonly onChanged: UiEventHandler<UiEventArgs> = new UiEventHandler<UiEventArgs>()

	get value(): string {
		return this._value
	}

	set value(newValue: string) {
		let changed: boolean = newValue !== this._value
		this._value = newValue
		if (changed) { this.onChanged.invoke(this, new UiEventArgs())}
	}

	constructor(name: string) {
		super(name)
	}
}

// ----------------------------------------------------------------------

export class UiBoolItem extends UiItem {
	private _value: boolean = false
	readonly onChanged: UiEventHandler<UiEventArgs> = new UiEventHandler<UiEventArgs>()

	get value(): boolean {
		return this._value
	}

	set value(newValue: boolean) {
		let changed: boolean = newValue !== this._value
		this._value = newValue
		if (changed) { this.onChanged.invoke(this, new UiEventArgs())}
	}

	constructor(name: string) {
		super(name)
	}
}

// ----------------------------------------------------------------------

export class UiEnumItem extends UiItem {
	private _value: number = 0
	readonly onChanged: UiEventHandler<UiEventArgs> = new UiEventHandler<UiEventArgs>()

	values: UiItem[] = []

	get value(): number {
		return this._value
	}

	set value(newValue: number) {
		let changed: boolean = newValue !== this._value
		this._value = newValue
		if (changed) { this.onChanged.invoke(this, new UiEventArgs())}
	}

	constructor(name: string) {
		super(name)
	}
}

// ----------------------------------------------------------------------

export class UiCommandItem extends UiItem {
	func: (() => void) | null = null

	constructor(name: string) {
		super(name)
	}

	execute() {
		if (this.func === null) { throw new Error("Command not bound") }
		this.func!()
	}
}

// ----------------------------------------------------------------------

export class UiItemGroup extends UiItemsNode {
	private readonly nameLookup: Map<string, UiItemsNode> = new Map<string, UiItem>()
	private readonly children: UiItemsNode[] = []

	constructor(name: string) {
		super(name)
	}

	add(item: UiItemsNode) {
		let lookupName: string = item.name.toLowerCase()
		if (this.nameLookup.has(lookupName)) {
			throw new Error(`Already contains an item with name "${item.name}"`)
		}
		this.nameLookup.set(lookupName, item)
		this.children.push(item)
	}

	addGroup(name: string): UiItemGroup {
		let newGroup: UiItemGroup = new UiItemGroup(name)
		this.add(newGroup)
		return newGroup
	}

	addString(name: string): UiItem {
		let value: UiItem = new UiStringItem(name)
		this.add(value)
		return value
	}

	addItem(item: UiItem) {
		this.add(item)
	}

	getOrNull(name: string): UiItemsNode | null {
		let lookupName: string = name.toLowerCase()
		if (this.nameLookup.has(lookupName)) {
			return this.nameLookup.get(lookupName)!
		} else {
			return null
		}
	}

	get(name: string): UiItemsNode {
		let lookupName: string = name.toLowerCase()
		if (this.nameLookup.has(lookupName)) {
			return this.nameLookup.get(lookupName)!
		} else {
			throw new Error(`Group has no item with name "${name}"`)
		}
	}

	hasGroup(name: string): boolean {
		return this.getOrNull(name) instanceof UiItemGroup
	}

	hasItem(name: string): boolean {
		return this.getOrNull(name) instanceof UiItem
	}

	getGroup(name: string): UiItemGroup {
		let item: UiItemsNode = this.get(name)
		if (!(item instanceof UiItemGroup)) {
			throw new Error(`Group has a item with name "${name}" but no group`)
		}
		return item as UiItemGroup
	}

	getItemOrNull(name: string): UiItem | null {
		let item: UiItemsNode | null = this.getOrNull(name)
		if (item === null || !(item instanceof UiItem)) {
			return null
		}
		return item as UiItem
	}

	getItem(name: string): UiItem {
		let item: UiItemsNode = this.get(name)
		if (!(item instanceof UiItem)) {
			throw new Error(`Group has a group with name "${name}" but no item`)
		}
		return item as UiItem
	}

	getNodes(): UiItemsNode[] {
		return [...this.children]
	}

	getGroups(): UiItemGroup[] {
		return this.children.filter(item => item instanceof UiItemGroup) as UiItemGroup[]
	}

	getItems(): UiItem[] {
		return this.children.filter(item => item instanceof UiItem) as UiItem[]
	}
}

// ----------------------------------------------------------------------

export class UiItems {
	readonly root: UiItemGroup = new UiItemGroup("Items")

	getItemOrNull(path: string) : UiItem | null {
		return this.root.getItemOrNull(path)
	}

	getItem(path: string) : UiItem {
		let item: UiItem | null = this.getItemOrNull(path)
		if (item === null) {
			throw new Error(`Does not contain an item with path "${path}"`)
		}
		return item
	}

	getCommand(path: string) : UiCommandItem {
		let item: UiItem | null = this.getItemOrNull(path)
		if (item === null || !(item instanceof UiCommandItem)) {
			throw new Error(`Does not contain a command with path "${path}"`)
		}
		return item
	}

	getString(path: string) : UiStringItem {
		let item: UiItem | null = this.getItemOrNull(path)
		if (item === null || !(item instanceof UiStringItem)) {
			throw new Error(`Does not contain a string with path "${path}"`)
		}
		return item
	}

	getBool(path: string) : UiBoolItem {
		let item: UiItem | null = this.getItemOrNull(path)
		if (item === null || !(item instanceof UiBoolItem)) {
			throw new Error(`Does not contain a bool with path "${path}"`)
		}
		return item
	}

	getEnum(path: string) : UiEnumItem {
		let item: UiItem | null = this.getItemOrNull(path)
		if (item === null || !(item instanceof UiEnumItem)) {
			throw new Error(`Does not contain a enum with path "${path}"`)
		}
		return item
	}

	bindCommand(path: string, func: () => void) {
		this.getCommand(path).func = func
	}

	static parse(content: string): UiItems {
		let smlDocument: SmlDocument = SmlDocument.parse(content)
		return new UiItemsLoader(smlDocument.root).load()
	}

	static load(element: SmlElement): UiItems {
		return new UiItemsLoader(element).load()
	}
}

// ----------------------------------------------------------------------

export class UiItemsLoader {
	private rootElement: SmlElement
	
	constructor(rootElement: SmlElement) {
		this.rootElement = rootElement
	}

	private loadElement(element: SmlElement, group: UiItemGroup) {
		let lastEnumItem: UiEnumItem | null = null
		for (let node of element.namedNodes()) {
			if (!node.isAttribute()) { throw new Error("TODO") }
			let attribute: SmlAttribute = node as SmlAttribute
			let name: string = attribute.name
			if (name === "*") {
				if (lastEnumItem === null) { throw new Error("Syntax error") }
				let subItem: UiItem = new UiItem(lastEnumItem.name + ":"+attribute.getString(0))
				lastEnumItem.values.push(subItem)
				subItem.title = attribute.getString(1)
				continue 
			}
			lastEnumItem = null

			let type: number = attribute.getEnum(["Item", "Command", "String", "Bool", "Enum"], 0)
			let item: UiItem
			if (type === 0) {
				item = new UiItem(name)
			} else if (type === 1) {
				item = new UiCommandItem(name)
			} else if (type === 2) {
				item = new UiStringItem(name)
			} else if (type === 3) {
				item = new UiBoolItem(name)
			} else if (type === 4) {
				item = new UiEnumItem(name)
				lastEnumItem = item as UiEnumItem
			} else {
				throw new Error("TODO")
			}
			group.add(item)

			if (attribute.valueCount > 1) { item.title = attribute.getNullableString(1) }
		}
	}

	load(): UiItems {
		this.rootElement.assureName("Items")
		let commands: UiItems = new UiItems()
		this.loadElement(this.rootElement, commands.root)
		return commands
	}
}

// ----------------------------------------------------------------------

abstract class UiUtils {
	static dock(parent: HTMLElement, newContent: UiControl | null, oldContent: UiControl | null) {
		if (newContent === null) {
			parent.innerHTML = ""
		} else {
			if (newContent !== oldContent) {
				if (oldContent !== null) {
					oldContent.deincarnate()
					parent.innerHTML = ""
				}

				let generated: HTMLElement = newContent.incarnate()
				generated.style.height = "100%"
				generated.style.width = "100%"

				parent.appendChild(generated)
			}
		}
	}

	static setMargin(element: HTMLElement, control: UiControl) {
		if (control.margin === null) { return }
		element.style.margin = `${control.margin.top/10}rem ${control.margin.right/10}rem ${control.margin.bottom/10}rem ${control.margin.left/10}rem`
	}
}

// ----------------------------------------------------------------------

export class UiThickness {
	left: number
	top: number
	right: number
	bottom: number

	constructor(left: number, top: number, right: number, bottom: number) {
		this.left = left
		this.top = top
		this.right = right
		this.bottom = bottom
	}

	static uniform(value: number) {
		return new UiThickness(value, value, value, value)
	}
}

// ----------------------------------------------------------------------

export abstract class UiControl {
	margin: UiThickness | null = null

	abstract incarnate(): HTMLElement
	abstract deincarnate(): void
}

// ----------------------------------------------------------------------

export class UiCommandMenuItem {
	command: string | null = null
}

// ----------------------------------------------------------------------

export class UiCheckMenuItem {
	bool: string | null = null
}

// ----------------------------------------------------------------------

export class UiEnumMenuItem {
	enum: string | null = null
}

// ----------------------------------------------------------------------

export class UiMenuBarDropDownMenu {
	title: string | null = null

	readonly items: (UiCommandMenuItem | UiCheckMenuItem | UiEnumMenuItem)[] = []

	addItem(item: UiCommandMenuItem | UiCheckMenuItem | UiEnumMenuItem) {
		this.items.push(item)
	}
}

// ----------------------------------------------------------------------

export class UiMenuBar extends UiControl {
	private readonly items: UiMenuBarDropDownMenu[] = []
	protected incarnation: HTMLDivElement | null = null

	private lastActive: HTMLDivElement | null = null
	private lookup: Map<HTMLElement, HTMLElement> = new Map<HTMLElement,HTMLElement>()

	constructor() {
		super()
	}

	addItem(item: UiMenuBarDropDownMenu) {
		this.items.push(item)
		if (this.incarnation !== null) {
			alert("Todo")
		}
	}

	hideLast() {
		this.lookup.get(this.lastActive!)!.className = "MenuBarDropDownButton"
		this.lastActive!.style.display = "none"
		this.lastActive = null
		Ui.instance!._activeMenu = null
	}

	incarnate(): HTMLElement {
		let divElement: HTMLDivElement = document.createElement("div")
		divElement.className = "MenuBar"
		let thisMenuBar: UiMenuBar = this
		for (let item of this.items) {
			let menuBarDropDownContainer: HTMLDivElement = document.createElement("div")
			menuBarDropDownContainer.className = "MenuBarDropDownContainer"

			let menuBarDropDownButton: HTMLButtonElement = document.createElement("button")
			menuBarDropDownButton.className = "MenuBarDropDownButton"

			if (item.title !== null) {
				menuBarDropDownButton.innerText = Ui.getString(item.title)
			} else {
				menuBarDropDownButton.innerText = "DropDown"
			}

			menuBarDropDownContainer.appendChild(menuBarDropDownButton)

			let dropDownMenu: HTMLDivElement = document.createElement("div")
			dropDownMenu.className = "DropDownMenu"

			this.lookup.set(dropDownMenu, menuBarDropDownButton)

			menuBarDropDownButton.addEventListener("click", function onClick() {
				Ui.instance!._activeMenu = thisMenuBar
				if (thisMenuBar.lastActive !== null) {
					thisMenuBar.hideLast()
				} else {
					thisMenuBar.lastActive = dropDownMenu
					dropDownMenu.style.display = "flex"
					menuBarDropDownButton.className = "MenuBarDropDownButton_Selected"
				}
			})
			menuBarDropDownButton.addEventListener("mouseover", function onClick() {
				if (thisMenuBar.lastActive !== null) {
					if (thisMenuBar.lastActive !== dropDownMenu) {
						thisMenuBar.lookup.get(thisMenuBar.lastActive)!.className = "MenuBarDropDownButton"
						thisMenuBar.lastActive!.style.display = "none"
						thisMenuBar.lastActive = dropDownMenu
						dropDownMenu.style.display = "flex"
						menuBarDropDownButton.className = "MenuBarDropDownButton_Selected"
					}
				}
			})
			menuBarDropDownContainer.appendChild(dropDownMenu)

			for (let subItem of item.items) {
				if (subItem instanceof UiCommandMenuItem) {
					let menuItem: HTMLButtonElement = document.createElement("button")
					menuItem.className = "MenuItem"
					menuItem.innerText = "MenuItem"

					if (subItem.command !== null) {
						let command: UiCommandItem = Ui.items.getCommand(subItem.command)
						if (command.title !== null) {
							menuItem.innerText = Ui.getString(command.name!)
						}
						menuItem.addEventListener("click", function onClick() {
							thisMenuBar.hideLast()
							setTimeout(function() {
								dropDownMenu.style.removeProperty("display")
							}, 200)
							command.execute()
							
						})
					} else {
						menuItem.innerText = "Button"
					}
					dropDownMenu.appendChild(menuItem)
				} else if (subItem instanceof UiCheckMenuItem) {
					let menuItem: HTMLButtonElement = document.createElement("button")
					menuItem.className = "MenuItem"
					menuItem.innerText = "MenuItem"

					let boolItem: UiBoolItem = Ui.items.getBool(subItem.bool!)
					if (boolItem.title !== null) {
						menuItem.innerText = Ui.getString(boolItem.name!)
					}
					menuItem.addEventListener("click", function onClick() {
						thisMenuBar.hideLast()
						setTimeout(function() {
							dropDownMenu.style.removeProperty("display")
						}, 200)
						boolItem.value = !boolItem.value
					})

					let spanElement: HTMLSpanElement = document.createElement("span")
					spanElement.className = "CheckMark"
					menuItem.appendChild(spanElement)

					boolItem.onChanged.add(function() {
						spanElement.style.display = boolItem.value ? "inline" : "none"
					})
					spanElement.style.display = boolItem.value ? "inline" : "none"
					dropDownMenu.appendChild(menuItem)
				} else if (subItem instanceof UiEnumMenuItem) {
					let enumItem: UiEnumItem = Ui.items.getEnum(subItem.enum!)
					let index: number = 0
					for (let enumSubItem of enumItem.values) {
						let menuItem: HTMLButtonElement = document.createElement("button")
						menuItem.className = "MenuItem"
						menuItem.innerText = "EnumMenuItem"
												
						if (enumSubItem.title !== null) {
							menuItem.innerText = Ui.getString(enumSubItem.name!)
						}
						let currentIndex: number = index
						menuItem.addEventListener("click", function onClick() {
							thisMenuBar.hideLast()
							setTimeout(function() {
								dropDownMenu.style.removeProperty("display")
							}, 200)
							enumItem.value = currentIndex
						})

						let spanElement: HTMLSpanElement = document.createElement("span")
						spanElement.className = "CheckPoint"
						spanElement.style.display = enumItem.value === currentIndex ? "inline" : "none"
						menuItem.appendChild(spanElement)

						enumItem.onChanged.add(function() {
							spanElement.style.display = enumItem.value === currentIndex ? "inline" : "none"
						})

						dropDownMenu.appendChild(menuItem)
						index++
					}
				}
			}
			divElement.appendChild(menuBarDropDownContainer)
		}
		this.incarnation = divElement
		return divElement
	}

	deincarnate(): void {
		this.incarnation = null
	}
}

// ----------------------------------------------------------------------

export class UiLinearLayoutChild {
	readonly control: UiControl
	readonly weight: number | null

	constructor(control: UiControl, weight: number | null = null) {
		this.control = control
		this.weight = weight
	}
}

// ----------------------------------------------------------------------

export class UiLinearLayout extends UiControl {
	readonly vertical: boolean
	private readonly children: UiLinearLayoutChild[] = []
	protected incarnation: HTMLDivElement | null = null

	constructor(vertical: boolean = false) {
		super()
		this.vertical = vertical
	}

	addChild(child: UiLinearLayoutChild) {
		this.children.push(child)
		if (this.incarnation !== null) {
			alert("Todo")
		}
	}

	incarnate(): HTMLElement {
		let divElement: HTMLDivElement = document.createElement("div")
		divElement.className = "LinearLayout"
		divElement.style.display = "flex"
		divElement.style.flexDirection = this.vertical ? "column" : "row"
		divElement.style.justifyContent = "start"
		divElement.style.overflow = "auto"

		for (let child of this.children) {
			let incarnatedChild: HTMLElement = child.control.incarnate()
			if (child.weight !== null) {
				incarnatedChild.style.flex = child.weight.toString()
			}
			divElement.appendChild(incarnatedChild)
		}
		UiUtils.setMargin(divElement, this)
		this.incarnation = divElement
		return divElement
	}

	deincarnate(): void {
		this.incarnation = null
	}
}

// ----------------------------------------------------------------------

export class UiGridLayoutChild {
	readonly control: UiControl
	readonly columnIndex: number
	readonly columnSpan: number
	readonly rowIndex: number
	readonly rowSpan: number

	constructor(control: UiControl, columnIndex: number, columnSpan: number | null, rowIndex: number, rowSpan: number | null) {
		this.control = control
		this.columnIndex = columnIndex
		this.columnSpan = columnSpan ?? 1
		this.rowIndex = rowIndex
		this.rowSpan = rowSpan ?? 1
	}
}

// ----------------------------------------------------------------------

export class UiGridLayout extends UiControl {
	private readonly children: UiGridLayoutChild[] = []
	protected incarnation: HTMLDivElement | null = null

	constructor() {
		super()
	}

	addChild(child: UiGridLayoutChild) {
		this.children.push(child)
		if (this.incarnation !== null) {
			alert("Todo")
		}
	}

	incarnate(): HTMLElement {
		let divElement: HTMLDivElement = document.createElement("div")
		divElement.className = "GridLayout"
		divElement.style.display = "grid"
		divElement.style.overflow = "auto"

		for (let child of this.children) {
			let incarnatedChild: HTMLElement = child.control.incarnate()
			incarnatedChild.style.gridColumn = `${child.columnIndex + 1} / span ${child.columnSpan}` 
			incarnatedChild.style.gridRow = `${child.rowIndex + 1} / span ${child.rowSpan}` 
			divElement.appendChild(incarnatedChild)
		}

		this.incarnation = divElement
		return divElement
	}

	deincarnate(): void {
		this.incarnation = null
	}
}

// ----------------------------------------------------------------------

export class UiTab {
	content: UiControl | null = null
	text: string | null = null

	constructor() {
		
	}
}

// ----------------------------------------------------------------------

export class UiTabControl extends UiControl {
	private readonly tabs: UiTab[] = []
	protected incarnation: HTMLDivElement | null = null

	constructor() {
		super()
	}

	addTab(tab: UiTab) {
		this.tabs.push(tab)
		if (this.incarnation !== null) {
			alert("Todo")
		}
	}

	incarnate(): HTMLElement {
		let divElement: HTMLDivElement = document.createElement("div")
		divElement.className = "TabControl"
		divElement.style.display = "flex"
		divElement.style.flexDirection = "column"
		divElement.style.justifyContent = "start"
		divElement.style.overflow = "auto"

		let headerDivElement: HTMLDivElement = document.createElement("div")
		headerDivElement.className = "TabControlHeader"
		headerDivElement.style.flexDirection = "row"
		headerDivElement.style.display = "flex"
		headerDivElement.style.overflow = "auto"

		divElement.appendChild(headerDivElement)

		let areaDivElement: HTMLDivElement = document.createElement("div")
		areaDivElement.className = "TabControlArea"
		areaDivElement.style.overflow = "auto"
		areaDivElement.style.flex = "1"

		divElement.appendChild(areaDivElement)

		let incarnatedButtons: (HTMLButtonElement)[] = []
		let incarnatedContentAreas: (HTMLElement)[] = []
		for (let i=0; i<this.tabs.length; i++) {
			let isSelected: boolean = i === 0
			let tab: UiTab = this.tabs[i]
			
			let tabButtonElement: HTMLButtonElement = document.createElement("button")
			
			if (tab.text !== null) {
				tabButtonElement.innerText= Ui.getString(tab.text)
			} else {
				tabButtonElement.innerText = "Tab"
			}
			tabButtonElement.className = isSelected ? "TabControlButton_Selected" : "TabControlButton"
			incarnatedButtons.push(tabButtonElement)
			headerDivElement.appendChild(tabButtonElement)
			
			let incarnatedContentArea: HTMLDivElement = document.createElement("div")
			incarnatedContentArea.style.height = "100%"
			incarnatedContentArea.style.width = "100%"

			if (tab.content !== null) { 
				let incarnatedChild: HTMLElement = tab.content.incarnate()
				incarnatedChild.style.height = "100%"
				incarnatedChild.style.width = "100%"
				incarnatedContentArea.appendChild(incarnatedChild)
			}

			if (!isSelected) incarnatedContentArea.style.display = "none"
			incarnatedContentAreas.push(incarnatedContentArea)
			areaDivElement.appendChild(incarnatedContentArea)
		}

		let thisControl: UiTabControl = this
		for (let i=0; i<this.tabs.length; i++) {
			let incarnatedButton: HTMLButtonElement = incarnatedButtons[i]
			incarnatedButton.addEventListener("click", function onClick() {
				for (let i=0; i<thisControl.tabs.length; i++) {
					let curButton: HTMLButtonElement = incarnatedButtons[i]
					let curContent: HTMLElement = incarnatedContentAreas[i]

					curButton.className = incarnatedButton === curButton ? "TabControlButton_Selected" : "TabControlButton"
					curContent.style.display = incarnatedButton === curButton ? "block" : "none"
				}
			})
		}

		this.incarnation = divElement
		return divElement
	}

	deincarnate(): void {
		this.incarnation = null
	}
}

// ----------------------------------------------------------------------

export class UiTextBox extends UiControl {
	readonly multiLine: boolean
	protected incarnation: HTMLElement | null = null

	item: string | null = null

	constructor(multiLine: boolean = false) {
		super()
		this.multiLine = multiLine
	}

	incarnate(): HTMLElement {
		let stringValue: UiStringItem | null = null
		if (this.item !== null) {
			stringValue = Ui.items.getItem(this.item!) as UiStringItem
		}
		if (this.multiLine) {
			let textAreaElement: HTMLTextAreaElement = document.createElement("textarea")
			textAreaElement.className = "TextBox"
			textAreaElement.style.resize = "none"
			if (stringValue !== null) {
				textAreaElement.value = stringValue.value
				textAreaElement.addEventListener("input", function() {
					if (textAreaElement.value !== stringValue!.value) {
						stringValue!.value = textAreaElement.value
					}
				})
				stringValue.onChanged.add(function() {
					if (stringValue!.value !== textAreaElement.value) {
						textAreaElement.value = stringValue!.value
					}
				})
			}
			this.incarnation = textAreaElement
			return textAreaElement
		} else {
			let inputElement: HTMLInputElement = document.createElement("input")
			inputElement.className = "TextBox"
			inputElement.type = "text"
			if (stringValue !== null) {
				inputElement.value = stringValue.value
				inputElement.addEventListener("input", function() {
					if (inputElement.value !== stringValue!.value) {
						stringValue!.value = inputElement.value
					}
				})
				stringValue.onChanged.add(function() {
					if (stringValue!.value !== inputElement.value) {
						inputElement.value = stringValue!.value
					}
				})
			}
			this.incarnation = inputElement
			return inputElement
		}
	}

	deincarnate(): void {
		this.incarnation = null
	}
}

// ----------------------------------------------------------------------

export class UiButton extends UiControl {
	protected incarnation: HTMLButtonElement | null = null

	command: string | null = null

	incarnate(): HTMLElement {
		let buttonElement: HTMLButtonElement = document.createElement("button")
		UiUtils.setMargin(buttonElement, this)
		buttonElement.className = "Button"
		if (this.command !== null) {
			let command: UiCommandItem = Ui.items.getCommand(this.command)
			if (command.title !== null) {
				buttonElement.innerText = Ui.getString(command.title)
			}
			buttonElement.addEventListener("click", function onClick() {
				command.execute()
			})
		} else {
			buttonElement.innerText = "Button"
		}
		this.incarnation = buttonElement
		return buttonElement
	}

	deincarnate(): void {
		this.incarnation = null
	}
}

// ----------------------------------------------------------------------

export class UiCheckBox extends UiControl {
	protected incarnation: HTMLLabelElement | null = null

	incarnate(): HTMLElement {
		let labelElement: HTMLLabelElement = document.createElement("label")
		UiUtils.setMargin(labelElement, this)
		labelElement.className = "CheckBox"
		labelElement.innerText = "CheckBox Text"

		let inputElement: HTMLInputElement = document.createElement("input")
		inputElement.type = "checkbox"
		labelElement.appendChild(inputElement)

		let spanElement: HTMLSpanElement = document.createElement("span")
		labelElement.appendChild(spanElement)
		
		this.incarnation = labelElement
		return labelElement
	}

	deincarnate(): void {
		this.incarnation = null
	}
}

// ----------------------------------------------------------------------

export class UiLabel extends UiControl {
	item: string | null = null

	incarnate(): HTMLElement {
		let divElement: HTMLDivElement = document.createElement("div")
		divElement.className = "Label"
		if (this.item !== null) {
			divElement.innerText = Ui.getString(this.item)
		} else {
			divElement.innerText = "Label"
		}
		
		divElement.style.display = "flex"
		divElement.style.alignItems = "center"
		divElement.style.justifyContent = "center"
		return divElement
	}

	deincarnate(): void {
		
	}
}

// ----------------------------------------------------------------------

export class UiNothing extends UiControl {
	incarnate(): HTMLElement {
		let divElement: HTMLDivElement = document.createElement("div")
		divElement.className = "Nothing"
		divElement.style.display = "flex"
		return divElement
	}

	deincarnate(): void {
		
	}
}

// ----------------------------------------------------------------------

export class UiWindow {
	private element: HTMLElement

	private _content: UiControl | null = null

	get content(): UiControl | null {
		return this._content
	}

	set content(value: UiControl | null) {
		UiUtils.dock(this.element, value, this._content)
		this._content = value
	}

	constructor(element: HTMLElement) {
		this.element = element
	}
}

// ----------------------------------------------------------------------

export class Ui {
	private bodyElement: HTMLBodyElement

	static instance: Ui | null = null
	
	_items: UiItems | null = null

	static get items(): UiItems {
		return Ui.instance!._items!
	}

	_activeMenu: UiMenuBar | null = null

	constructor() {
		Ui.instance = this

		this.bodyElement = document.body as HTMLBodyElement

		this.bodyElement.addEventListener("click", function onClick(event) {
			let target: HTMLElement = event.target as HTMLElement
			if (Ui.instance?._activeMenu !== null) {
				if (target.closest(".MenuBar") === null) {
					Ui.instance?._activeMenu.hideLast()
				}
			}
		})

		let styleElement: HTMLStyleElement = document.createElement("style")
		styleElement.textContent = `
			body {
				/*background-image: linear-gradient(blue, cyan);*/
				background-color: #F0F0F0;
				//padding: 1rem;
				font-family: sans-serif;
			}
			* {
				box-sizing: border-box;
				margin: 0;
				padding: 0;
				font: inherit;
			}
			html, body {
				height: 100%;
			}
			.LinearLayout {
				background-color: rgb(240, 240, 240);
			}
			.Button {
				background-image: linear-gradient(rgb(240, 240, 240), rgb(229, 229, 229));
				min-width: 7.2rem;
				min-height: 2.0rem;
				padding-bottom: 0.1rem;
				border: 0.1rem solid rgb(172, 172, 172);
			}
			.Button:hover {
				border: 0.1rem solid rgb(126, 180, 234);
				background-image: linear-gradient(rgb(236, 244, 252), rgb(220, 236, 252));
			}
			.Button:active {
				border: 0.1rem solid rgb(86, 157, 229);
				background-image: linear-gradient(rgb(218, 236, 252), rgb(196, 224, 252));
			}
			.Button:focus {
				border: 0.1rem solid rgb(51, 153, 255);
				outline: 0.1rem dotted rgb(31, 31, 31);
				outline-offset: -0.3rem
			}
			.TextBox {
				border: 0.1rem solid rgb(171, 173, 179);
				padding: 0.11rem 0.3rem 0.19rem 0.3rem;
			}
			.TextBox:hover {
				border: 0.1rem solid rgb(126, 180, 234);
			}
			.TextBox:focus {
				border: 0.1rem solid rgb(86, 157, 229);
				outline: none;
			}
			.TabControlArea {
				background-color: rgb(255, 255, 255);
				border: solid rgb(172, 172, 172);
				border-width: 0 0.1rem 0.1rem 0.1rem;
				outline: 0.1rem solid rgb(172, 172, 172);
			}
			.TabControlHeader {
				padding: 0.2rem 0.2rem 0 0.2rem;
			}
			.TabControlButton_Selected {
				background-color: rgb(255, 255, 255);
				border: solid rgb(172, 172, 172);
				border-width: 0.1rem 0.1rem 0 0.1rem;
				padding: 0.0rem 0.6rem 0.1rem 0.6rem;
				z-index: 2;
				margin: -0.2rem -0.2rem 0 -0.2rem;
			}
			.TabControlButton_Selected:focus {
				outline: 0.1rem dotted rgb(31, 31, 31);
				outline-offset: -0.3rem
			}
			.TabControlButton {
				background-image: linear-gradient(rgb(240, 240, 240), rgb(229, 229, 229));
				border: solid rgb(172, 172, 172);
				border-width: 0.1rem 0.1rem 0 0.1rem;
				padding: 0.0rem 0.4rem 0.15rem 0.4rem;
			}
			.TabControlButton:hover {
				border: solid rgb(126, 180, 234);
				border-width: 0.1rem 0.1rem 0 0.1rem;
				background-image: linear-gradient(rgb(236, 244, 252), rgb(220, 236, 252));
			}
			.TabControlButton:focus {
				outline: 0.1rem dotted rgb(31, 31, 31);
				outline-offset: -0.3rem;
			}
			.CheckBox {
				position: relative;
				padding-left: 1.6rem;
				user-select: none;
			}
			.CheckBox input {
				position: absolute;
				width: 0;
				height: 0;
				opacity: 0;
			}
			.CheckBox span {
				position: absolute;
				top: 0.12rem;
				left: 0;
				height: 1.2rem;
				width: 1.2rem;
				border: 0.1rem solid rgb(112, 112, 112);
				background-color: rgb(255, 255, 255);
			}
			.CheckBox:hover span {
				border: 0.1rem solid rgb(51, 153, 255);
				background-color: rgb(243, 249, 255);
			}
			.CheckBox:active span {
				border: 0.1rem solid rgb(0, 124, 222);
				background-color: rgb(217, 236, 255);
			}
			.CheckBox span:after {
				position: absolute;
				display: none;
				content: "";
			}
			.CheckBox input:checked ~ span:after {
				display: block;
			}
			.CheckBox span:after {
				left: 0.3rem;
				top: 0.05rem;
				width: 0.3rem;
				height: 0.6rem;
				border: solid rgb(32, 32, 32);
				border-width: 0 3px 3px 0;
				transform: rotate(45deg);
			}
			.CheckBox input:focus ~ span {
				border: 0.1rem solid rgb(51, 153, 255);
			}
			.MenuBar {
				background-color: rgb(245, 246, 247);
			}
			.MenuBarDropDownContainer {
				float: left;
			}
			.MenuBarDropDownButton {
				background-color: rgb(245, 246, 247);
				border: 0.1rem solid rgb(245, 246, 247);
				padding: 0.1rem 0.5rem 0.1rem 0.5rem;
			}
			.MenuBarDropDownContainer:hover .MenuBarDropDownButton {
				background-color: rgb(213, 231, 248);
				border: 0.1rem solid rgb(122, 177, 232);
			}
			.MenuBarDropDownButton:focus {
				/*background-color: rgb(213, 231, 248);
				border: 0.1rem solid rgb(122, 177, 232);*/
				outline: none;
			}
			.MenuBarDropDownButton:active {
				background-color: rgb(184, 216, 249);
				border: 0.1rem solid rgb(98, 163, 229);
			}
			.MenuBarDropDownButton_Selected {
				background-color: rgb(184, 216, 249);
				border: 0.1rem solid rgb(98, 163, 229);
				padding: 0.1rem 0.5rem 0.1rem 0.5rem;
			}
			.DropDownMenu {
				background-color: rgb(240, 240, 240);
				border: 0.1rem solid rgb(151, 151, 151);
				position: absolute;
				z-index: 100;
				padding: 0.2rem;
				display: none;
				flex-direction: column;
			}
			.MenuItem {
				background-color: rgb(240, 240, 240);
				border: 0.1rem solid rgb(240, 240, 240);
				padding: 0.1rem 2.5rem 0.1rem 1.7rem;
				text-align: left;
				position: relative;
			}
			.MenuItem:hover {
				background-color: rgb(209, 226, 242);
				border: 0.1rem solid rgb(120, 174, 229);
			}
			.MenuItem .CheckMark {
				position: absolute;
				left: 0.5rem;
				top: 0.29rem;
				width: 0.5rem;
				height: 0.8rem;
				border: solid rgb(32, 32, 32);
				border-width: 0 3px 3px 0;
				transform: rotate(45deg);
			}
			.MenuItem .CheckPoint {
				position: absolute;
				left: 0.6rem;
				top: 0.6rem;
				width: 0.5rem;
				height: 0.5rem;
				border-radius: 50%;
				background-color: rgb(32, 32, 32);
			}
			`

		document.head.appendChild(styleElement)
	}

	createFullscreenWindow(): UiWindow {
		return new UiWindow(this.bodyElement)
	}

	setFontFamily(family: string) {
		this.bodyElement.style.fontFamily = family
	}

	static getString(id: string): string {
		if (id.indexOf(":") > 0) {
			let parts: string[] = id.split(":")
			let enumItem: UiEnumItem = Ui.items.getEnum(parts[0])
			let index: number = Number.parseInt(parts[1])
			let subItem: UiItem = enumItem.values[index]
			return subItem.title ?? ""
		} else {
			return Ui.items.getItem(id).title ?? ""
		}
	}
}