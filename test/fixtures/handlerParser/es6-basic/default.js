
class myHandler {

	constructor() {

	}

	@endpoint(url: /books method: get name: my_list_of_books versions: [1.1.2])
	list(req, res) {

	}


	@endpoint(url: /books method: put name: update_book versions: [1.0])
	update(req, res) {
		
	}

	@endpoint(url: /books method: post name: new_book versions: [1.1.2,1.0])
	create(req, res) {

	}


	@endpoint(url: /books method: delete name: delete_book)
	remove(req, res) {
		
	}
}
