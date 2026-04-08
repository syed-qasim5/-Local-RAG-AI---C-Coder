#include <iostream>
using namespace std;

struct Node 
{
  int data;
  Node* next;
  Node(int val)
  {
    data = val;
    next = nullptr;
  }
};

struct list 
{
  Node* head;
  Node* tail;

  list()
  {
    head = tail = nullptr;
  }

  void push_front(int val)
  {
    Node* newNode = new Node(val);
    if (head == nullptr)
    {
      head = tail = newNode;
      return;
    }
    newNode->next = head;
    head = newNode;
  }

  void push_back(int val)
  { 
    Node* newNode = new Node(val);
    if (head == nullptr)
    {
      head = tail = newNode;
      return;
    }
    tail->next = newNode;
    tail = newNode;
  }

  void insert_mid(int val, int pos)
  {
    if (pos < 0)
    {
      cout << "Invalid position!\n";
      return;
    }
    if (pos == 0)
    {
      push_front(val);
      return;
    }

    Node* temp = head;
    for (int i = 0; i < pos - 1 && temp != nullptr; i++)
    {
      temp = temp->next;
    }

    if (temp == nullptr)
    {
      cout << "Position out of range!\n";
      return;
    }

    Node* newNode = new Node(val);
    newNode->next = temp->next;
    temp->next = newNode;

    if (newNode->next == nullptr)
      tail = newNode;
  }

  void pop_front()
  {
    if (head == nullptr)
    {
      cout << "List is empty!\n";
      return;
    }
    Node* temp = head;
    head = head->next;
    delete temp;
    if (head == nullptr)
      tail = nullptr;
  }

  void pop_back()
  {
    if (head == nullptr)
    {
      cout << "List is empty!\n";
      return;
    }
    if (head == tail)
    {
      delete head;
      head = tail = nullptr;
      return;
    }

    Node* temp = head;
    while (temp->next != tail)
    {
      temp = temp->next;
    }
    delete tail;
    tail = temp;
    tail->next = nullptr;
  }

  void print()
  {
    Node* temp = head;
    while (temp != nullptr)
    {
      cout << temp->data << " -> ";
      temp = temp->next;
    }
    cout << "NULL\n";
  }

  void search(int key)
  {
    Node* temp = head;
    int idx = 0;
    while (temp != nullptr)
    {
      if (temp->data == key)
      {
        cout << "Found " << key << " at position " << idx << endl;
        return;
      }
      temp = temp->next;
      idx++;
    }
    cout << key << " not found.\n";
  }

  void delete_mid(int pos)
  {
    if (head == nullptr)
    {
      cout << "List is empty!\n";
      return;
    }

    if (pos == 0)
    {
      pop_front();
      return;
    }

    Node* temp = head;

    for (int i = 0; i < pos - 1 && temp->next != nullptr; i++)
    {
      temp = temp->next;
    }

    if (temp->next == nullptr)
    {
      cout << "Position out of range!\n";
      return;
    }

    Node* nextnode = temp->next;
    temp->next = nextnode->next;

    if (nextnode == tail)
      tail = temp;

    delete nextnode;
  }
};

int main() 
{
  list l;

  cout << "Adding elements:\n";
  l.push_back(10);
  l.push_back(20);
  l.push_back(30);
  l.print();

  cout << "\nPush front:\n";
  l.push_front(5);
  l.print();

  cout << "\nInsert mid (at pos 2):\n";
  l.insert_mid(15, 2);
  l.print();

  cout << "\nDelete mid (at pos 2):\n";
  l.delete_mid(2);
  l.print();

  cout << "\nPop front:\n";
  l.pop_front();
  l.print();

  cout << "\nPop back:\n";
  l.pop_back();
  l.print();

  cout << "\nSearch for 20:\n";
  l.search(20);

  cout << "\nSearch for 100:\n";
  l.search(100);

  return 0;
}

