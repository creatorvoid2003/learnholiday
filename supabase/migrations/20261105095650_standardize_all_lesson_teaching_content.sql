
alter table public.course_lessons
  add column if not exists learning_objectives text[] not null default '{}',
  add column if not exists explanation text not null default '',
  add column if not exists worked_example text not null default '',
  add column if not exists practice_task text not null default '',
  add column if not exists expected_result text not null default '',
  add column if not exists learner_exercise text not null default '',
  add column if not exists key_takeaways text[] not null default '{}';

update public.course_lessons set
 learning_objectives = array['Identify a fraction and its parts','Recognise equivalent fractions','Create equivalent fractions using multiplication or division'],
 explanation = 'A fraction represents equal parts of a whole. The numerator is the number of parts being considered; the denominator is the total number of equal parts. Equivalent fractions look different but represent the same value. To make an equivalent fraction, multiply or divide both numerator and denominator by the same non-zero number.',
 worked_example = 'Example: 1/2 = 2/4. Multiply the numerator and denominator of 1/2 by 2: (1 × 2)/(2 × 2) = 2/4. Both fractions represent one half.',
 practice_task = 'Draw a rectangle, divide it into 4 equal parts and shade 2. Then draw another rectangle divided into 8 equal parts and shade 4. Compare the shaded portions.',
 expected_result = 'Both drawings should show the same shaded amount: 2/4 and 4/8 are equivalent to 1/2.',
 learner_exercise = 'Write two fractions equivalent to 3/4. Explain which number you multiplied the numerator and denominator by.',
 key_takeaways = array['The numerator is above the fraction bar','The denominator is below the fraction bar','Multiply or divide both parts by the same non-zero number']
where id = '6075a2c3-76b0-43a9-b71e-8c4e1c5dc64b';

update public.course_lessons set
 learning_objectives = array['Explain what percent means','Convert percentages to decimals','Calculate a percentage of a quantity'],
 explanation = 'Percent means per hundred. A percentage can be written as a fraction with denominator 100 or as a decimal. To convert a percentage to a decimal, divide by 100. To find a percentage of an amount, convert the percentage to a decimal and multiply.',
 worked_example = 'Find 20% of 150. Convert 20% to 0.20, then calculate 0.20 × 150 = 30. Therefore, 20% of 150 is 30.',
 practice_task = 'Use 100 small squares or draw a 10 by 10 grid. Shade 25 squares to represent 25%. Then calculate 25% of 200.',
 expected_result = '25% of 200 is 50. One quarter of 200 is 50.',
 learner_exercise = 'Calculate 15% of 300 and 40% of 80. Show the conversion to decimals and each multiplication.',
 key_takeaways = array['Percent means per hundred','Divide by 100 to convert a percentage to a decimal','Multiply the decimal by the amount']
where id = 'dd4f966f-40b3-458b-8d5f-4941b7718b69';

update public.course_lessons set
 learning_objectives = array['Explain why letters are used in algebra','Identify variables, coefficients and constants','Solve a simple one-step equation'],
 explanation = 'Algebra uses letters to represent numbers that may be unknown or may change. A variable is the letter, a coefficient is the number multiplying the variable, and a constant is a number without a variable. An equation says two expressions are equal. Keep an equation balanced by performing the same operation on both sides.',
 worked_example = 'Solve x + 5 = 12. Subtract 5 from both sides: x + 5 − 5 = 12 − 5. Therefore x = 7. Check: 7 + 5 = 12.',
 practice_task = 'Create a balance-scale drawing. Put x + 3 on one side and 10 on the other. Remove 3 from both sides and identify the value of x.',
 expected_result = 'The equation becomes x = 7. Both sides remain equal because the same amount was removed.',
 learner_exercise = 'Solve x + 8 = 19 and 3x = 21. Show each step and check your answers by substitution.',
 key_takeaways = array['A variable represents a number','A coefficient multiplies a variable','Perform the same operation on both sides of an equation']
where id = '25d63a81-4440-497b-9d33-e38b6db514d7';

update public.course_lessons set
 learning_objectives = array['Explain what JavaScript does on a webpage','Recognise a JavaScript statement','Run a simple console message'],
 explanation = 'JavaScript is a programming language that can make web pages respond to user actions and update content. A statement is an instruction. The console is a browser tool where developers can view messages and errors while testing code.',
 worked_example = 'Try this JavaScript: const greeting = "Hello, learner"; console.log(greeting); The first statement stores text in a constant. The second prints that text in the developer console.',
 practice_task = 'Open your browser developer tools, select Console, and run the example. Change the message to a greeting of your own and run it again.',
 expected_result = 'The console displays the exact greeting stored in the greeting variable.',
 learner_exercise = 'Create a constant named school and store the name of a school in it. Use console.log() to display the value.',
 key_takeaways = array['JavaScript adds behaviour to webpages','Statements are instructions','console.log() displays information in the developer console']
where id = '8ea8ca15-a623-4c96-b95f-bb993490f244';

update public.course_lessons set
 learning_objectives = array['Explain what a variable stores','Choose between const and let','Recognise common JavaScript data types'],
 explanation = 'A variable is a named place for a value. Use const when you do not plan to reassign the variable. Use let when the value needs to change. Common data types include strings for text, numbers, booleans for true or false, arrays for ordered collections and objects for grouped properties.',
 worked_example = 'const learnerName = "Amina"; let score = 10; score = 15; The name is kept in a const variable, while score is declared with let because it is reassigned.',
 practice_task = 'Write one string, one number and one boolean variable. Use console.log() to display each value and typeof to inspect its type.',
 expected_result = 'The console should display the values and their types, such as string, number and boolean.',
 learner_exercise = 'Create variables for a subject name, number of lessons and whether a learner is registered. Choose suitable data types and explain your choices.',
 key_takeaways = array['Variables store values','const prevents reassignment of the binding','let allows reassignment','JavaScript values have different data types']
where id = '5980839c-a393-4880-bc6f-9ed4ff54f247';

update public.course_lessons set
 learning_objectives = array['Explain how a condition controls program flow','Write a simple if statement','Describe why functions are useful'],
 explanation = 'A condition is an expression that evaluates to true or false. An if statement runs a block only when its condition is true. A function is a reusable group of instructions. Functions can receive inputs called parameters and can return a result.',
 worked_example = 'Example: if (score >= 50) { console.log("Pass"); } This displays Pass when score is at least 50. A reusable function is: function add(a, b) { return a + b; } Calling add(2, 3) returns 5.',
 practice_task = 'Change the score in the condition to 40 and then 65. Run the code and observe when the message appears. Next, call add() with two different pairs of numbers.',
 expected_result = 'The pass message appears only when the score is 50 or higher. The add function returns the sum of its two inputs.',
 learner_exercise = 'Write a function that accepts a learner mark and returns whether it is a pass when the mark is at least 50. Test it with 35 and 70.',
 key_takeaways = array['if statements make decisions','Conditions evaluate to true or false','Functions organise reusable instructions']
where id = 'acf03cfb-4283-44bd-94f1-8693444395fa';

update public.course_lessons set
 learning_objectives = array['Define computer hardware','Identify common input and output devices','Distinguish processing, memory and storage'],
 explanation = 'Hardware means the physical parts of a computer that can be seen and touched. Input devices send data to a computer, output devices present information, the processor carries out instructions, memory holds data currently in use and storage keeps data for later use.',
 worked_example = 'When typing a document, the keyboard is an input device. The CPU processes instructions, RAM holds working data, and the monitor is an output device. A storage drive keeps the document after it is saved.',
 practice_task = 'Observe a computer or draw one. Label its monitor, keyboard, mouse, processor and storage device. Classify each as input, output, processing or storage.',
 expected_result = 'The keyboard and mouse are input devices; the monitor is output; the CPU processes instructions; storage keeps files.',
 learner_exercise = 'A learner prints a document. Identify the input device used to create it, the component that processes instructions and the output device that produces the paper copy.',
 key_takeaways = array['Hardware is physical computer equipment','Input sends data in; output presents results','The CPU processes instructions','Memory and storage have different roles']
where id = 'e16e7d79-a11b-4811-a01f-ac46fda7017c';

update public.course_lessons set
 learning_objectives = array['Define software','Distinguish system software from application software','Explain the role of an operating system'],
 explanation = 'Software is a collection of programs and instructions. System software manages the computer and provides a platform for other programs. An operating system manages hardware, files, memory and applications. Application software helps people perform specific tasks such as writing documents or browsing the web.',
 worked_example = 'On a computer, Windows manages devices and allows programs to run. A word processor is application software used to create documents. The operating system helps the word processor access files and the printer.',
 practice_task = 'Look at the programs available on a computer or phone. List the operating system and three applications. Describe one task each application helps you perform.',
 expected_result = 'You should identify one operating system and distinguish it from programs used for specific tasks.',
 learner_exercise = 'Classify a web browser, operating system, spreadsheet program and device driver as system or application software. Give a reason for each classification.',
 key_takeaways = array['Software is made of programs and instructions','System software manages the computer','Application software helps users perform tasks']
where id = 'c59e0529-8e51-4624-8b8e-abf4e185783b';

update public.course_lessons set
 learning_objectives = array['Explain the difference between files and folders','Organise files using clear names','Recognise safe digital habits'],
 explanation = 'A file stores information such as a document, picture or presentation. A folder groups files so they are easier to find. Good digital organisation uses meaningful names and sensible folders. Digital safety includes protecting passwords, updating software, checking unexpected messages and keeping personal information private.',
 worked_example = 'Create a folder called School Work, then a folder inside it called ICT. Save a document as HTML_Practice_01 rather than New Document. The name makes its purpose easier to recognise.',
 practice_task = 'Plan a folder structure for school work with folders for ICT, Mathematics and English. Give each folder two example file names.',
 expected_result = 'Your structure should group related files and use names that make the contents clear.',
 learner_exercise = 'A message from an unknown sender asks you to open an attachment and enter your password. Explain two safe steps you should take before doing anything.',
 key_takeaways = array['Files contain information; folders organise files','Clear names make work easier to find','Use unique passwords and keep software updated','Be cautious with unexpected links and attachments']
where id = 'c8e271c6-d676-414c-9a2b-d86a1af5ae94';

update public.course_lessons set
 learning_objectives = array['Explain the purpose of CSS','Identify a CSS rule, selector and declaration','Connect CSS to an HTML page'],
 explanation = 'CSS means Cascading Style Sheets. It controls how HTML content looks, including colours, fonts, spacing and layout. A CSS rule contains a selector, which chooses elements, and declarations, which set properties and values.',
 worked_example = 'h1 { color: navy; font-size: 2rem; } The h1 selector targets level-one headings. The color declaration changes the text colour, while font-size changes its size.',
 practice_task = 'Create a simple HTML page with a heading. Add a style element in the head and use the example rule to change the heading colour and size.',
 expected_result = 'The heading should appear in navy and be larger than normal paragraph text.',
 learner_exercise = 'Write a CSS rule that makes all paragraphs dark green and gives them a font size of 18 pixels. Identify the selector and both declarations.',
 key_takeaways = array['CSS controls presentation','A selector chooses elements','Declarations contain properties and values','CSS can be embedded or stored in an external stylesheet']
where id = '4f4f7795-8fcb-41a6-9a19-2ee0fbcec98e';

update public.course_lessons set
 learning_objectives = array['Recognise element, class and ID selectors','Apply colour styles','Explain padding and margin'],
 explanation = 'An element selector targets HTML tags such as p. A class selector starts with a dot and can be reused on many elements. An ID selector starts with # and should identify one unique element on a page. Padding is space inside an element; margin is space outside it.',
 worked_example = '.notice { background: lavender; padding: 16px; margin: 12px 0; } This rule targets every element with class notice, adds space inside it and separates it from nearby elements.',
 practice_task = 'Create two paragraphs with the same class notice. Apply the example rule, then change the background colour and padding.',
 expected_result = 'Both paragraphs should receive the same background and spacing because they share the class.',
 learner_exercise = 'Write one class selector for a warning message and one ID selector for a page header. Give each a different text colour.',
 key_takeaways = array['Element selectors target tags','Class selectors are reusable and start with a dot','ID selectors start with #','Padding is inside; margin is outside']
where id = 'd7846075-98b7-40e3-a2f5-098eac0076d2';

update public.course_lessons set
 learning_objectives = array['Explain responsive web design','Identify flexible layout techniques','Describe how media queries work'],
 explanation = 'Responsive design helps a website remain usable on phones, tablets and computers. Flexible widths avoid fixed layouts that overflow. Flexbox arranges items along one dimension, while CSS Grid helps create rows and columns. Media queries apply CSS when conditions such as viewport width are met.',
 worked_example = '@media (max-width: 600px) { .container { grid-template-columns: 1fr; } } This rule changes a grid to one column when the viewport is 600 pixels wide or narrower.',
 practice_task = 'Create a two-column card layout using CSS Grid. Add the media query from the example so the cards stack on a narrow screen. Resize the browser window.',
 expected_result = 'The cards should appear in two columns on a wider screen and one column on a narrow screen.',
 learner_exercise = 'Design a responsive layout for three subject cards. Explain how it should behave on a desktop and on a phone.',
 key_takeaways = array['Responsive design adapts to screen sizes','Flexible layouts reduce overflow','Flexbox and Grid arrange content','Media queries apply styles under selected conditions']
where id = '9d7decf0-9457-4ed9-8c5f-25187cb674e1';

update public.course_lessons set
 learning_objectives = array['Explain the purpose of HTML','Recognise elements and tags','Identify common HTML page elements'],
 explanation = 'HTML means HyperText Markup Language. It describes the structure and meaning of webpage content. An element is commonly made from an opening tag, content and a closing tag. Tags such as h1, p and a identify headings, paragraphs and links.',
 worked_example = '<h1>My first page</h1>\n<p>Welcome to my webpage.</p>\n<a href="https://example.com">Visit example</a> The heading introduces the page, the paragraph provides text and the anchor creates a link.',
 practice_task = 'Write a small HTML fragment containing one heading, one paragraph and one link. Save it in an HTML file and open it in a browser.',
 expected_result = 'The browser should show a heading, a paragraph and a clickable link.',
 learner_exercise = 'Create a short introduction about a hobby using one h1 heading and two paragraphs. Add a link to a related website.',
 key_takeaways = array['HTML provides webpage structure','Elements use tags to describe content','Headings, paragraphs and links have different purposes']
where id = '8b7f6919-8b8f-4717-a321-bb15c12104fd';

update public.course_lessons set
 learning_objectives = array['Identify the main parts of an HTML document','Explain the purpose of head and body','Create and open a basic webpage'],
 explanation = 'A standard HTML document begins with a doctype declaration. The html element contains the whole page. The head contains information about the page, such as its title and character encoding. The body contains the content visitors see.',
 worked_example = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello</h1>\n  <p>My first webpage.</p>\n</body>\n</html>',
 practice_task = 'Create a file named index.html. Type the example structure, save it and open it in a browser. Change the title and visible heading.',
 expected_result = 'The browser tab should show My Page (or your changed title) and the page should display the heading and paragraph.',
 learner_exercise = 'Create a webpage about your school with a suitable title, one main heading and two paragraphs. Include the language attribute and character encoding.',
 key_takeaways = array['The doctype declares an HTML document','The head stores page information','The body contains visible webpage content','Save the file with an .html extension']
where id = 'c744c47c-263a-4170-8945-f202b33fb98d';

update public.course_lessons set
 learning_objectives = array['Use headings and paragraphs to organise text','Create hyperlinks with the anchor element','Add images with meaningful alternative text'],
 explanation = 'HTML provides elements for common page content. Headings from h1 to h6 organise sections by importance. Paragraphs use p. Links use the anchor element with an href destination. Images use img with a source and descriptive alt text so people using assistive technology can understand the image.',
 worked_example = '<h1>My Hobbies</h1>\n<p>I enjoy reading and football.</p>\n<a href="https://example.com">Explore a topic</a>\n<img src="football.jpg" alt="A football on a field">',
 practice_task = 'Build a page with one heading, two paragraphs, one link and one image. If you do not have an image file, use a suitable image you already have permission to use.',
 expected_result = 'The page should display structured text, a working link and an image with alternative text.',
 learner_exercise = 'Create a mini profile page with a heading, two paragraphs, a link to a learning resource and an image. Explain why the alt attribute matters.',
 key_takeaways = array['Use headings in a meaningful order','Use paragraphs for blocks of text','The href attribute sets a link destination','The alt attribute describes an image']
where id = '6e5f9fe5-9a19-41fe-be32-5855d59ffb71';
