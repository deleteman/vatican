
module.exports = class BooksV2 {

	constructor() {

	}

	@endpoint(url: /books method: get name: my_list_of_books versions: [2.1.2])
	list(req, res) {
		
	}

	@endpoint(url: /books method: get name: my_list_of_books_2_1_3 versions: [2.1.3])
	list2(req, res) {
		
	}

	@endpoint(url: /books method: put name: update_book versions: [2.0])
	update(req, res) {
		
	}

	@endpoint(url: /books method: post name: new_book versions: [2.1.2,2.0,2.1.3])
	create(req, res) {

	}


	@endpoint(url: /books method: delete name: delete_book versions: [2.0])
	remove(req, res) {
		
	}
}
