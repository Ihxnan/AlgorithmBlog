// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805107638517760
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    string str;
    cin >> str;
    string arr = str;
    sort(all(arr));
    arr.erase(unique(all(arr)), arr.end());
    reverse(all(arr));
    cout << "int[] arr = new int[]{";
    for (int i = 0; i < arr.size(); ++i)
        cout << arr[i] << (i < arr.size() - 1 ? "," : "");
    cout << "};" << endl;
    cout << "int[] index = new int[]{";
    for (int i = 0; i < str.size(); ++i)
        cout << arr.find(str[i]) << (i < str.size() - 1 ? "," : "");
    cout << "};" << endl;
}
